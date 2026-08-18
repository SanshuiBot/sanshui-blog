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
const GISCUS_ATTRS: Record<string, string> = {
  repo: 'SanshuiBot/sanshui-blog',
  repoId: 'MDEwOlJlcG9zaXRvcnkxODc3NDA2NjE=',
  category: 'General',
  categoryId: 'DIC_kwDOCzCx9c4DDncE',
  mapping: 'og:title', // 用页面 og:title（文章标题）作 term；pathname 含 basePath 与中文百分号编码，会原样成为 Discussion 标题，曾导致创建失败
  strict: '0',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'top',
  lang: 'zh-CN',
  loading: 'lazy',
};

export default function PostComments() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const themeRef = useRef(theme);
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

    // 捕获阶段监听 iframe 的 load，兜住「脚本注入期间主题已切换」的竞态
    const syncThemeOnLoad = () => postTheme(el, themeRef.current);
    el.addEventListener('load', syncThemeOnLoad, true);

    el.appendChild(script);
    return () => {
      el.removeEventListener('load', syncThemeOnLoad, true);
      script.remove();
    };
  }, []);

  // 主题切换时同步给已加载的 iframe
  useEffect(() => {
    const el = containerRef.current;
    if (el) postTheme(el, theme);
  }, [theme]);

  return (
    <section className="mt-16">
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
