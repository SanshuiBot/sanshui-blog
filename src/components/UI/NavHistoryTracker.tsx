'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isStaticFilePathname, resetNavHistory, syncNavHistory } from '@/lib/nav-history';

/**
 * 站内导航链跟踪器（Providers 顶层挂载，全站生效）。
 * -----------------------------
 * 维护 sessionStorage 里的「本标签页实际走过的站内路由栈」，供文章页返回按钮
 * （BackButton）与 pre-hydration 内联脚本（back-button-bootstrap.ts）判断
 * 「该 router.back() 还是回首页」。取代旧 InSiteNavMarker 的「同源 referrer +
 * 站内会话标记」双信号猜测——那套信号在移动端有两个失效模式（见 nav-history.ts
 * 头注释）：切后台发 pagehide 误清标记 → 误回首页；reload 后 referrer 变自身
 * 同源/标记残留 → history.back() 退到站外。
 *
 * 写入规则：
 *  1. 文档加载（每次全新加载）：referrer 是本站路由（reload 自指/本站全文档
 *     导航）→ 保留链；外站/空（新标签、书签、地址栏、标签页恢复）/静态文件
 *     → 重置为 [当前页]；
 *  2. 路由变化（软导航/popstate 前进后退）：syncNavHistory 镜像历史栈；
 *  3. 捕获阶段点击跨域 http(s) 链接：导航尚未发生即重置为 [当前页] ——
 *     离开后再回来时浏览器上一条已不是本站页面，应回首页。
 *
 * 刻意**不**监听 pagehide：移动端切后台/切 tab 同样发 pagehide（PC 切窗口不发），
 * 在 pagehide 里截断会误判「无站内历史」而回首页（旧 bug 根因）；而 reload 与
 * 地址栏离开分别由规则 1 的 referrer 判定覆盖（reload 自指保留、外站 referrer
 * 重置），无需在卸载时做任何事。
 */
export default function NavHistoryTracker() {
  // usePathname 剥掉了 basePath，只作「路由变了」的触发器；链里存含 basePath 的
  // location.pathname（pre-hydration 脚本的 location.assign 直接可用）。
  const pathname = usePathname();

  // ── 1. 文档加载：referrer 判定保留或重置 ──
  // 只读 window.location/document.referrer（非响应式值），无额外依赖；
  // 仅文档加载时执行一次，后续路由变化由下面的 pathname effect 同步。
  useEffect(() => {
    const current = window.location.pathname;
    if (referrerIsInSiteRoute()) syncNavHistory(current);
    else resetNavHistory(current);
  }, []);

  // ── 2. 软导航 / popstate：镜像历史栈 ──
  useEffect(() => {
    syncNavHistory(window.location.pathname);
  }, [pathname]);

  // ── 3. 跨域链接点击：导航尚未发生即重置 ──
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isLeavingClick(e)) return;
      resetNavHistory(window.location.pathname);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}

/** referrer 是否表明「本文档从本站路由进入」：同源且非静态文件（feed.xml 等） */
function referrerIsInSiteRoute(): boolean {
  try {
    const ref = new URL(document.referrer);
    if (ref.origin !== window.location.origin) return false;
    return !isStaticFilePathname(ref.pathname);
  } catch {
    // 空 referrer（新标签页/书签/地址栏/标签页恢复）或非法 URL：下方条目不可信
    return false;
  }
}

/** 点击是否将跨域离开本站：http(s) 外链、左键无修饰键、本标签页打开 */
function isLeavingClick(e: MouseEvent): boolean {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const target = e.target as HTMLElement | null;
  const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!anchor) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin === window.location.origin) return false;
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
