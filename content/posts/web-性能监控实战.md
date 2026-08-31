---
title: Web 性能监控实战：从 PerformanceObserver 到 LCP 归因
date: 2026-07-15
tags: [性能, 前端, 技术]
excerpt: LCP 1.2s 到 3.8s 的真实排查过程。本文讲 PerformanceObserver API、Web Vitals 指标体系、LCP 元素归因、CLS 预测布局偏移，再到 RUM 上报方案。
---

# Web 性能监控实战：从 PerformanceObserver API 到 LCP 归因

线上告警「LCP 中位数 3.8s，P95 6.2s」。我花了三天定位到问题：首屏一张 1.8MB 的 hero 图，用 `<img>` 直接引用，浏览器在解析 HTML 时遇到 `<img>` 才开始下载，等图片下载完，LCP 已经炸了。这篇文章记录完整的排查链路和落地的 RUM 监控方案。

## 一、Web Vitals 指标体系回顾

Google 在 2020 年提出 Core Web Vitals 三大核心指标：

| 指标 | 全称                      | 含义             | 良好阈值 |
| ---- | ------------------------- | ---------------- | -------- |
| LCP  | Largest Contentful Paint  | 最大内容绘制时间 | < 2.5s   |
| INP  | Interaction to Next Paint | 交互到下次绘制   | < 200ms  |
| CLS  | Cumulative Layout Shift   | 累计布局偏移     | < 0.1    |

LCP 替代了旧的 FMP（First Meaningful Paint），因为 FMP 难以定义且实现复杂。LCP 由浏览器原生计算，稳定可靠。INP 在 2024 年 3 月正式替代 FID，更全面反映交互响应性。

## 二、PerformanceObserver：监控的核心 API

旧方案 `performance.getEntries()` 是同步快照，新方案 `PerformanceObserver` 是异步订阅，且能拿到浏览器自动计算的 LCP / CLS 等「合成指标」。

```ts
const po = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.startTime, entry.entryType);
  }
});
po.observe({ type: 'largest-contentful-paint', buffered: true });
```

`buffered: true` 表示「订阅时把已经发生的事件也回放给我」。这对 LCP 监控很关键——LCP 在页面加载过程中可能多次刷新，我们需要拿到最后一次的值。

## 三、LCP 监控：必须监听多次刷新

LCP 不是单次事件。页面加载过程中，浏览器会不断重新计算「最大内容元素」，每次新元素比之前的大就刷新 LCP 时间戳。

```ts
let lastLCP = 0;
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  lastLCP = lastEntry.startTime;
}).observe({ type: 'largest-contentful-paint', buffered: true });

// 页面 unload 时上报
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    reportRUM({ lcp: lastLCP });
  }
});
```

**踩坑 1**：很多人用 `pagehide` 上报，但 iOS Safari 上 `pagehide` 在 bfcache 命中时不触发。**用 `visibilitychange` 配合 `hidden` 状态最稳**。

**踩坑 2**：不要在 `onload` 里上报 LCP。`onload` 触发时 LCP 可能还没发生（异步加载的图片）。**最佳时机是 `visibilitychange` 转 hidden**，即用户准备离开时。

## 四、LCP 归因：找出谁拖慢了首屏

光知道 LCP 是 3.8s 没用，必须知道是哪张图、哪个 DOM 元素、哪一段网络请求慢。

LCP 时间可以拆解为四段：

1. **TTFB**：服务器响应时间
2. **Resource Load Delay**：LCP 资源开始加载的延迟
3. **Resource Load Time**：LCP 资源加载时间
4. **Element Render Delay**：资源加载完到元素绘制的延迟

实现：

```ts
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
    element: Element;
    url: string;
    size: number;
    loadTime: number;
    renderTime: number;
    startTime: number;
  };

  // 找到对应的 resource entry
  const navEntry = performance.getEntriesByType('navigation')[0];
  const resourceEntries = performance.getEntriesByType('resource');
  const lcpRes = resourceEntries.find((r) => r.name === lastEntry.url);

  const ttfb = navEntry.responseStart;
  const lcpResStart = lcpRes ? lcpRes.startTime : 0;
  const lcpResEnd = lcpRes ? lcpRes.responseEnd : 0;
  const lcpRenderTime = lastEntry.renderTime || lastEntry.loadTime;

  const attr = {
    lcp_time: lcpRenderTime,
    ttfb,
    res_load_delay: lcpResStart - ttfb,
    res_load_time: lcpResEnd - lcpResStart,
    render_delay: lcpRenderTime - lcpResEnd,
    url: lastEntry.url,
    tag: lastEntry.element.tagName,
    size: lastEntry.size,
  };

  reportRUM({ lcp_attribution: attr });
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

拿到归因后，就能针对性优化：

- `ttfb` 大：后端慢，上 CDN、上 SSR cache
- `res_load_delay` 大：资源开始下载晚，加 `<link rel="preload">` 或 `<img fetchpriority="high">`
- `res_load_time` 大：资源本身大，压缩、用 WebP/AVIF、做尺寸自适应 `srcset`
- `render_delay` 大：JS 阻塞渲染，检查主线程长任务

## 五、INP 监控：交互到下一帧

INP 测量用户交互到下一帧绘制的延迟。它在整个页面生命周期里记录所有交互，取最差值（P98）作为 INP。

```ts
const inpMap = new Map<string, number>();
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const e = entry as PerformanceEventTiming;
    if (!e.interactionId) continue;
    const key = String(e.interactionId);
    inpMap.set(key, Math.max(inpMap.get(key) ?? 0, e.duration));
  }
}).observe({ type: 'event', buffered: true });

window.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'hidden') return;
  if (inpMap.size === 0) return;
  const worst = Math.max(...inpMap.values());
  reportRUM({ inp: worst });
});
```

**踩坑**：`performance.getEntriesByType('event')` 在某些浏览器返回的不包含 `interactionId`。必须用 PerformanceObserver 并指定 `type: 'event'`。

**INP 排查思路**：

- 大部分 INP 高是因为 JS 长任务（> 50ms）阻塞主线程
- 用 `PerformanceObserver({ type: 'long-animation-frame' })`（Chrome 116+）拿到所有长帧
- 重点查 React 的同步 re-render、大列表的 diff

## 六、CLS 监控：累计布局偏移

CLS 是会话期间所有「意外布局偏移」的累计分数。

```ts
let cls = 0;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!(entry as any).hadRecentInput) {
      cls += (entry as any).value;
    }
  }
}).observe({ type: 'layout-shift', buffered: true });
```

`hadRecentInput` 排除用户输入触发的偏移（点击展开手风琴不算意外偏移）。

**CLS 优化要点**：

1. 图片和 iframe 必须设 `width` 和 `height`，浏览器会预留空间
2. 字体加载用 `font-display: swap` + `size-adjust` 减少 FOUT 偏移
3. 避免在已有内容上方动态插入 DOM（cookie banner、广告、推送通知）

## 七、TTFB 监控：服务器响应时间

```ts
const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
const ttfb = navEntry.responseStart;
```

TTFB 慢的常见原因：

- 后端做了过多同步 IO（数据库查询、模板渲染）
- CDN cache miss，回源慢
- HTML 里 inline 了过多数据

## 八、长任务监控

```ts
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Long Task:', entry.duration, 'ms');
  }
}).observe({ type: 'longtask', buffered: true });
```

但 `longtask` 只告诉你有长任务，不告诉你哪个函数。Chrome 116+ 引入 `long-animation-frame`，可以拿到具体调用栈：

```ts
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const e = entry as any;
    console.log({
      duration: e.duration,
      scripts: e.scripts.map((s: any) => ({
        name: s.name,
        duration: s.duration,
        source: s.sourceURL,
      })),
    });
  }
}).observe({ type: 'long-animation-frame', buffered: true });
```

## 九、RUM 上报方案

**踩坑 1**：用 `fetch` 上报会被 bfcache 干扰。bfcache 命中时 `fetch` 可能被取消。**推荐用 `navigator.sendBeacon`**，它专门为页面卸载时上报设计：

```ts
function reportRUM(data: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify(data)], {
    type: 'application/json',
  });
  navigator.sendBeacon('/api/rum', blob);
}
```

**踩坑 2**：`sendBeacon` 有大小限制（64KB），超过会被静默丢弃。**批量上报时控制 payload 大小**。

**踩坑 3**：上报时机错了会导致数据丢失。正确时机：

- `visibilitychange` 转 `hidden`：用户切 tab、关页面、跳转
- 不要用 `beforeunload`：iOS Safari 不触发，且会阻塞 bfcache

## 十、实战案例：LCP 3.8s → 1.2s

线上 LCP 中位数 3.8s。LCP 归因发现：

```text
ttfb: 220ms
res_load_delay: 1800ms
res_load_time: 1500ms
render_delay: 280ms
url: https://cdn.example.com/hero-2026.jpg
tag: IMG
size: 1980000  // 1.8MB
```

问题：

1. hero 图 1.8MB，下载就 1.5s
2. 图片是 `<img src="hero.jpg">`，浏览器要先解析 HTML、遇到 `<img>` 才开始下载，资源开始延迟 1.8s
3. 没设 `width` / `height`，CLS 也受影响

优化：

```html
<link
  rel="preload"
  as="image"
  href="hero-2026.jpg"
  imagesrcset="hero-480.webp 480w, hero-1024.webp 1024w, hero-1920.webp 1920w"
  imagesizes="100vw"
  fetchpriority="high"
/>
<img
  src="hero-480.webp"
  srcset="hero-480.webp 480w, hero-1024.webp 1024w, hero-1920.webp 1920w"
  sizes="100vw"
  width="1920"
  height="1080"
  fetchpriority="high"
  decoding="async"
  alt="Hero"
/>
```

具体改动：

1. **格式**：JPG → WebP，1.8MB → 380KB
2. **尺寸自适应**：`srcset` + `sizes`，移动端只下载 480w 版本（80KB）
3. **预加载**：`<link rel="preload">` 让图片在 HTML 解析早期就开始下载
4. **fetchpriority**：`high` 让浏览器优先调度这张图
5. **尺寸预留**：`width` + `height` 消除 CLS

效果：

- 桌面端 LCP：3.8s → 1.2s
- 移动端 LCP：4.5s → 1.8s
- CLS：0.18 → 0.02

## 十一、持续监控的几个原则

1. **分位数上报**：中位数 + P75 + P95。Web Vitals 用 P75 作为 ranking 信号。
2. **分维度看**：设备类型、网络类型、地理位置、路由。整体好看不代表所有用户都好。
3. **建立 baseline**：上线前先跑一周 RUM，记录正常波动范围。否则上线后发现「指标变差了」其实只是周末流量。
4. **告警阈值用分位数而非均值**：LCP 均值 2s 看着不错，P95 可能 8s。

## 十二、总结

Web 性能监控的核心是「用对 API、抓对指标、找准时机」：

- **PerformanceObserver** 是订阅式、异步、能拿合成指标的现代方案
- **LCP 归因** 是定位首屏瓶颈的关键工具
- **`visibilitychange` hidden** 是 RUM 上报的最佳时机
- **`sendBeacon`** 是卸载时上报的首选

性能不是一次性优化，是持续的「测量 → 分析 → 优化 → 验证」循环。先把监控搭起来，再谈优化。
