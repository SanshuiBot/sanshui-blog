'use client';
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

/**
 * Giscus 评论（GitHub Discussions 驱动，零后端，静态导出可用）
 * -----------------------------
 * 实现：动态注入 giscus 客户端脚本，iframe 与站点主题联动（官方内置 light / dark）。
 * 脚本仅在客户端执行，不污染 RSC payload。
 *
 * 注意：不要用 transparent_light —— giscus 上游 /themes/transparent_light.css 缺失
 * （2026-08 验证 404，transparent_dark 正常），widget 会把它当自定义相对路径解析成
 * /zh-CN/transparent_light，触发样式表 MIME 报错。light / dark 均正常。
 *
 * 配置已就绪：repoId / categoryId 已通过 GitHub API 直接获取（仓库 Discussions 已启用）。
 * 更换讨论分类时：GitHub 仓库新建分类 → giscus.app 下拉里选中它 →
 * 复制页面底部脚本片段里的 data-category-id，覆盖下面的 categoryId。
 */
// 属性名必须是 giscus 官方 kebab-case（data-repo-id / data-category-id）：
// camelCase 会被浏览器小写化（data-repoId → data-repoid），widget 读不到，
// 创建讨论时 repositoryId/categoryId 会以 "undefined" 传给 GitHub 被拒绝。
const GISCUS_ATTRS: Record<string, string> = {
  repo: 'SanshuiBot/sanshui-blog',
  'repo-id': 'MDEwOlJlcG9zaXRvcnkxODc3NDA2NjE=',
  category: 'General',
  'category-id': 'DIC_kwDOCzCx9c4DDncE',
  mapping: 'og:title', // 用页面 og:title（文章标题）作 term，Discussion 标题干净可读（而非编码后的 URL 路径）
  // strict=1：按 term 的 sha1 摘要 in:body 查找。中文标题走 in:title 匹配不可靠
  // （GitHub 搜索对 CJK 索引滞后，讨论已存在也可能长期 404）；摘要是 ASCII
  // 可即时命中，且 giscus 创建讨论时正文会自动带上该 sha1 标记。
  strict: '1',
  'reactions-enabled': '1',
  'emit-metadata': '0',
  'input-position': 'top',
  lang: 'zh-CN',
  loading: 'lazy',
  // 注：Edge 的「Images loaded lazily」干预警告来自 giscus widget 内部
  // （Comment.tsx / Reply.tsx 的懒加载头像），与本站配置无关，宿主页无法修复。
};

export default function PostComments() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const themeRef = useRef(theme);
  // 记录 giscus iframe 是否已加载完成：加载完成前（about:blank）向它
  // postMessage 会抛「target origin 不匹配」异常（接收窗口源是父页面）
  const loadedRef = useRef(false);
  // 主题变化时同步到 ref（脚本注入 / iframe load 兜底读取最新值，绕开闭包过期）
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // 注入脚本（仅一次；StrictMode 双执行由 cleanup 幂等兜底，见约定 #21）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    for (const [key, value] of Object.entries(GISCUS_ATTRS)) {
      script.setAttribute(`data-${key}`, value);
    }
    script.setAttribute('data-theme', themeRef.current);

    // 捕获阶段监听 iframe 的 load（script 的 load 会先触发，须按 target 过滤）：
    // 加载完成才标记 ready 并同步一次主题，兜住「注入期间主题已切换」的竞态
    const syncThemeOnLoad = (event: Event) => {
      if (!(event.target instanceof HTMLIFrameElement)) return;
      loadedRef.current = true;
      postTheme(el, themeRef.current);
    };
    el.addEventListener('load', syncThemeOnLoad, true);

    el.appendChild(script);

    // 兜底：若 iframe 已被缓存快速加载（load 事件在 addEventListener 前就触发了），
    // 轮询检查 iframe 是否已提交到 giscus.app 跨域文档（避免 loadedRef 永远为 false
    // 导致主题无法同步）。判定依据：同源 about:blank（未加载）时 contentDocument 可读
    // 为非 null；提交到跨域 giscus.app 后 contentDocument 返回 null。不能只看
    // src/srcdoc —— giscus 创建 iframe 时就设了 src，但窗口 origin 仍是父页面，
    // 此时 postMessage 会抛「target origin 不匹配」。
    const checkExisting = () => {
      if (loadedRef.current) return;
      const frame = el.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      // 同源 about:blank 时 contentDocument 可读；跨域 giscus.app 时抛 SecurityError
      //（而非返回 null，见 MDN contentDocument）。统一用 try/catch 覆盖两种情形：
      // 无异常 → 同源，未加载完成；有异常 → 跨域，giscus 已接管，可安全 postMessage。
      let doc: Document | null = null;
      try {
        doc = frame!.contentDocument;
      } catch {}
      if (frame && doc === null) {
        loadedRef.current = true;
        postTheme(el, themeRef.current);
      }
    };
    const pollTimer = setTimeout(checkExisting, 1000);

    return () => {
      el.removeEventListener('load', syncThemeOnLoad, true);
      clearTimeout(pollTimer);
      script.remove();
    };
  }, []);

  // 主题切换时同步给已加载的 iframe（未加载完成前跳过，由 load 监听兜底）
  useEffect(() => {
    const el = containerRef.current;
    if (el && loadedRef.current) postTheme(el, theme);
  }, [theme]);

  return (
    <section className="mt-16">
      {/* React 19 会把组件内 <link> hoist 到 <head>：预连接 giscus.app，
          省掉动态注入 client.js 时的 DNS/TLS 往返（评论加载提速） */}
      <link rel="preconnect" href="https://giscus.app" />
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-black/60 dark:text-white/60">评论</h2>
        <span className="h-px flex-1 bg-black/[0.06] dark:bg-white/[0.06]" />
      </div>
      <div ref={containerRef} className="min-h-40" />
    </section>
  );
}

/** 向 giscus iframe 发送 setConfig 消息切换主题（giscus 官方 postMessage 协议） */
function postTheme(container: HTMLElement, theme: string) {
  const frame = container.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
  frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, 'https://giscus.app');
}
