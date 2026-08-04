---
title: 浏览器原生 API 实战：View Transitions 与 Container Queries
date: 2026-07-12
tags: [浏览器API, 前端, 技术]
excerpt: 不用框架、不用 GSAP，浏览器原生就能做流畅过渡动画。本文讲 View Transitions API、scroll-driven animations、popover API，再到 5 个渐进增强实战。
---

# 浏览器原生 API 实战：View Transitions 与 Container Queries

我维护一个不依赖 React 的纯静态博客，但想要两个动效：

1. 文章列表点击 → 详情页时，缩略图「飞」到详情页 hero 位置
2. 滚动到某段时，文字淡入并向上滑入

传统方案要引 GSAP 或 React Transition，但 2025 年这两个都有浏览器原生实现：**View Transitions API** 和 **scroll-driven animations**。这篇文章记录零依赖实战。

## 一、View Transitions API：跨页面动画

### 基础 API

```js
document.startViewTransition(() => {
  // 在这里更新 DOM
  // 浏览器会自动捕获新旧状态，做过渡动画
});
```

执行流程：

1. 浏览器捕获当前页面快照
2. 调用回调函数，DOM 更新
3. 浏览器捕获新页面快照
4. 自动播放新旧状态之间的过渡动画（默认 cross-fade）

### SPA 路由切换

```js
async function navigate(url) {
  if (!document.startViewTransition) {
    location.href = url;
    return;
  }

  document.startViewTransition(async () => {
    const html = await fetch(url).then((r) => r.text());
    document.body.innerHTML = html;
  });
}

document.querySelectorAll('a[data-spa]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(a.href);
  });
});
```

### 跨文档 View Transitions（MPA 场景）

```css
@view-transition {
  navigation: auto;
}
```

仅这一行 CSS，普通多页应用之间的跳转就会自动生成过渡动画。**不需要 JS**。

**踩坑 1**：跨文档 View Transitions 在 2025 年仅 Chrome / Edge 实现，Safari / Firefox 还是实验性。需要降级：

```css
@supports (view-transition-name: none) {
  @view-transition {
    navigation: auto;
  }
}
```

## 二、给元素起名字：view-transition-name

```html
<article>
  <img src="thumb.jpg" />
  <h2>文章标题</h2>
</article>
```

```css
article img {
  view-transition-name: post-thumb;
}
article h2 {
  view-transition-name: post-title;
}
```

`view-transition-name` 是这个元素在过渡动画里的「身份」。从列表页跳到详情页时，**只要详情页里有同名元素，浏览器就会自动把它从旧位置动画到新位置**。

## 三、踩坑 2：view-transition-name 必须唯一

```css
/* ❌ 列表页所有缩略图同名，浏览器报错 */
.post-card img {
  view-transition-name: post-thumb;
}

/* ✅ 用 JS 动态分配 */
function setTransitionNames() {
  document.querySelectorAll('.post-card img').forEach((img, i) => {
    img.style.viewTransitionName = `thumb-${i}`
  })
}
```

每个参与过渡的元素 `view-transition-name` 必须在**当前页面**唯一。列表页 10 张缩略图都叫 `post-thumb`，浏览器会报错。

## 四、自定义过渡动画

默认是 cross-fade。可以完全自定义：

```css
::view-transition-old(post-thumb) {
  animation: fade-out 0.3s forwards;
}
::view-transition-new(post-thumb) {
  animation: slide-in 0.4s forwards;
}
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

`::view-transition-old(name)` 和 `::view-transition-new(name)` 是伪元素，分别代表旧状态和新状态的快照。

## 五、踩坑 3：view-transition-name 会触发重排

```css
* {
  view-transition-name: none !important;
}
```

如果一个元素意外有了 `view-transition-name`，会触发一次额外重排。**生产代码里只在需要动画的元素上加 `view-transition-name`，避免用通配符**。

## 六、Scroll-Driven Animations：原生滚动动画

### 旧方案：IntersectionObserver + requestAnimationFrame

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
});
document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
```

缺点：每个元素都要 observe，回调里还要加 / 删 class。

### 新方案：scroll-timeline + animation

```css
.fade-in {
  animation: fade-up linear;
  animation-timeline: view();
  animation-range: entry 0% cover 40%;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**零 JS**。`animation-timeline: view()` 让动画跟随元素在视口里的位置变化。`animation-range` 定义动画的起止点。

### 三种 timeline

1. `animation-timeline: scroll()`：跟随某个 scroll container
2. `animation-timeline: view()`：跟随元素在视口里的可见度
3. `animation-timeline: --my-timeline`：自定义 timeline（用 `timeline-scope`）

## 七、踩坑 4：scroll-timeline 与 bfcache

`animation-timeline: view()` 需要在每次元素位置变化时更新动画状态。如果 bfcache 命中，元素位置可能不变，动画会停在某个中间状态。

**解决**：用 `pageshow` 事件重置：

```js
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    document.querySelectorAll('.fade-in').forEach((el) => {
      el.style.animation = 'none';
      void el.offsetWidth; // trigger reflow
      el.style.animation = '';
    });
  }
});
```

## 八、Popover API：原生浮层

### 旧方案：自己写浮层

```js
function showPopover(content) {
  const el = document.createElement('div');
  el.className = 'popover';
  el.innerHTML = content;
  document.body.appendChild(el);
  // 还要处理 backdrop、点击外部关闭、ESC 关闭、accessibility...
}
```

每个浮层都要自己处理：背景遮罩、点击外部关闭、ESC 关闭、键盘可访问性、`aria-modal`。烦得要命。

### 新方案：popover 属性

```html
<button popovertarget="my-popover">打开</button>

<div id="my-popover" popover>
  <p>浮层内容</p>
</div>
```

**自动处理**：

- 点击外部关闭（light dismiss）
- ESC 关闭
- `aria` 属性自动同步
- 最上层的浮层自动获得 focus
- 多个 popover 自动堆叠顺序

## 九、踩坑 5：popover 与 dialog 的区别

很多人把 `popover` 当 `dialog` 用，但**两者本质不同**：

- `dialog`（modal）：阻塞整个页面，背景内容不可交互
- `popover`：只是浮层，背景内容依然可以交互

```html
<!-- 浮层，背景可点 -->
<div id="tooltip" popover>...</div>

<!-- 模态对话框，背景阻塞 -->
<dialog id="modal">
  <p>...</p>
  <button onclick="document.getElementById('modal').close()">关闭</button>
</dialog>
<button onclick="document.getElementById('modal').showModal()">打开</button>
```

## 十、Container Queries 配合 View Transitions

```css
@container (min-width: 600px) {
  .post-card {
    flex-direction: row;
  }
}
```

```css
.post-card {
  view-transition-name: var(--card-name);
}
```

Container Queries 控制**布局**，View Transitions 控制**状态切换**。两者正交。

## 十一、实战案例：博客列表 → 详情页过渡

### 列表页

```html
<a href="/posts/hello-world/" class="post-card">
  <img src="thumb.jpg" class="post-card-img" />
  <h2 class="post-card-title">Hello World</h2>
</a>
```

```css
.post-card-img {
  view-transition-name: thumb-hello-world;
}
.post-card-title {
  view-transition-name: title-hello-world;
}
```

### 详情页

```html
<header class="post-hero">
  <img src="thumb.jpg" class="post-hero-img" />
  <h1 class="post-hero-title">Hello World</h1>
</header>
```

```css
.post-hero-img {
  view-transition-name: thumb-hello-world;
}
.post-hero-title {
  view-transition-name: title-hello-world;
}
```

### 启用 MPA 过渡

```css
@view-transition {
  navigation: auto;
}
```

效果：用户点列表项时，缩略图和标题会**自动从列表位置「飞」到详情页 hero 位置**，伴随 cross-fade。零 JS 实现。

## 十二、降级方案

```css
/* 现代浏览器：scroll-driven animations */
@supports (animation-timeline: view()) {
  .fade-in {
    animation: fade-up linear;
    animation-timeline: view();
    animation-range: entry 0% cover 40%;
  }
}

/* 老浏览器：IntersectionObserver 兜底 */
@supports not (animation-timeline: view()) {
  .fade-in.visible {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 0.4s,
      transform 0.4s;
  }
}
```

```js
// 仅在不支持时启用 JS 兜底
if (!CSS.supports('animation-timeline: view()')) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  });
  document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
}
```

## 十三、性能对比

| 方案                    | 首屏 JS | 动画 FPS | 兼容性             |
| ----------------------- | ------- | -------- | ------------------ |
| GSAP + React Transition | 80KB    | 55-60    | 全平台             |
| 浏览器原生 API          | 0KB     | 60       | Chrome / Safari TP |

原生 API 的优势：

1. **零依赖**：bundle size 0
2. **GPU 加速**：浏览器原生优化
3. **流畅度更高**：在 compositor 线程跑，不阻塞主线程

## 十四、总结

2025 年浏览器原生 API 已经能取代大部分「轻量动效库」：

1. **View Transitions**：跨页面元素过渡
2. **scroll-driven animations**：滚动驱动动画
3. **Popover API**：原生浮层

配合 `@supports` 渐进增强，可以做到「现代浏览器零依赖流畅，老浏览器 JS 兜底」。
