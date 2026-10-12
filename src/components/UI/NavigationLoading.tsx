'use client';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import SpinRing from '@/components/UI/SpinRing';
import { useSafeTimeout } from '@/components/UI/useSafeTimeout';
import { BASE_PATH } from '@/lib/basePath';

/** 显示门控：导航持续超过该时长才出现胶囊（快跳转零闪烁） */
export const NAV_LOADING_SHOW_DELAY_MS = 300;
/** 兜底：极端情况下完成信号漏调（JS 异常/跳转取消），胶囊最长显示时长 */
export const NAV_LOADING_FALLBACK_MS = 10_000;

interface NavigationContextValue {
  /**
   * 手动触发导航加载（延迟 300ms 显示非阻塞胶囊）。
   * 普通内部链接点击已由 Provider 的全局委托自动覆盖，仅命令式跳转
   * （如搜索弹窗键盘 Enter 的 router.push）需要显式调用。
   */
  startNavigation: () => void;
  /** 手动通知导航完成（一般无需调用：pathname 变化已自动完成） */
  done: () => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  startNavigation: () => {},
  done: () => {},
});

export function useNavigationLoading() {
  return useContext(NavigationContext);
}

/**
 * 判断一次锚点点击是否属于「站内客户端路由跳转」，需要挂等待胶囊。
 * 纯函数（依赖当前 location/basePath），方便单测覆盖判定矩阵：
 *  - 左键、无修饰键、非 target=_blank、无 download；
 *  - 同源且路径在 basePath 之下；
 *  - 非纯 hash 跳转（#anchor 同页定位）；
 *  - 非当前 URL 重复点击；
 *  - 非带扩展名的静态文件（/feed.xml、/og.png 等走原生下载/打开，红线 #1）。
 */
export function isInternalNavigation(
  anchor: HTMLAnchorElement,
  loc: { origin: string; pathname: string; search: string; hash: string; href: string },
  basePath: string,
): boolean {
  let url: URL;
  try {
    url = new URL(anchor.href, loc.href);
  } catch {
    return false;
  }
  if (url.origin !== loc.origin) return false;
  if (
    !url.pathname.startsWith(basePath === '' ? '/' : `${basePath}/`) &&
    url.pathname !== basePath
  ) {
    return false;
  }
  // 纯 hash 定位：path+search 不变，仅锚点变化
  if (url.pathname === loc.pathname && url.search === loc.search && url.hash) return false;
  // 同一 URL 重复点击（无 hash）：Next 不会重新导航
  if (url.pathname === loc.pathname && url.search === loc.search && !url.hash) return false;
  // 静态文件：最后一段带扩展名（feed.xml / og.png / *.txt 等），交给浏览器原生处理
  const lastSegment = url.pathname.replace(/\/+$/, '').split('/').pop() ?? '';
  if (/\.[a-z0-9]+$/i.test(lastSegment)) return false;
  return true;
}

/**
 * 导航等待胶囊（非阻塞，全站）：
 * 导航栏下方居中的玻璃小胶囊「⟳ 页面加载中…」，任何站内路由跳转持续 >300ms 时出现。
 *
 * 覆盖范围（一处委托，全站生效，红线 #13 收口于此）：
 *  - 所有内部 <a>/<Link> 点击（导航栏、卡片、标签、搜索结果、上下篇…）——document
 *    捕获阶段统一判定，新增页面/链接无需再手动挂 onClick；
 *  - 前进/后退（popstate）；
 *  - 命令式 router.push（如搜索键盘 Enter）走 startNavigation()。
 *
 * 与顶部 2px 滚动进度条（ScrollProgress，z-60/top-0）位置、形态、语义全部错开：
 * 胶囊固定 top-76px、z-70、pointer-events:none，不拦截任何点击，
 * 弹层（z-80）/toast（z-90）打开时自然在其之上，绝不是全屏遮罩。
 *
 * 完成信号：pathname 变化（含后退/前进）自动 done；另有 10s 兜底。
 * 进出场纯 CSS（常驻 DOM + .is-visible），无挂载/卸载硬切；reduced-motion 由
 * globals.css 全局 0.01ms 规则自动瞬切（红线 #32/#43）。
 */
export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  // pending：300ms 门控等待中；visible：胶囊已显示。ref 供回调内同步判态
  const pendingRef = useRef(false);
  const visibleRef = useRef(false);
  // useSafeTimeout：unmount 自动清理（ADR-0003）；cancel 由 set() 返回，见 hook 头注释
  const setShowTimer = useSafeTimeout();
  const setFallbackTimer = useSafeTimeout();
  const cancelShowRef = useRef<(() => void) | null>(null);
  const cancelFallbackRef = useRef<(() => void) | null>(null);

  const done = useCallback(() => {
    // 无活动导航时不调 setState（路径 effect 首挂载也会走这里），避免无效级联渲染
    const active = pendingRef.current || visibleRef.current;
    cancelShowRef.current?.();
    cancelFallbackRef.current?.();
    cancelShowRef.current = null;
    cancelFallbackRef.current = null;
    pendingRef.current = false;
    visibleRef.current = false;
    if (active) setVisible(false);
  }, []);

  const startNavigation = useCallback(() => {
    // 胶囊显示中再次跳转：保持显示、只续兜底，不重新 300ms 门控（避免退场又进场的闪烁）
    if (visibleRef.current) {
      cancelFallbackRef.current?.();
      cancelFallbackRef.current = setFallbackTimer(done, NAV_LOADING_FALLBACK_MS);
      return;
    }
    // 门控等待中忽略重复触发（同一跳转的连点 / 多个监听重复冒泡）
    if (pendingRef.current) return;
    pendingRef.current = true;
    // 仅延迟超过 300ms 才显示：快跳转在 timer 触发前 done()，胶囊永不出现
    cancelShowRef.current = setShowTimer(() => {
      pendingRef.current = false;
      visibleRef.current = true;
      setVisible(true);
      cancelFallbackRef.current = setFallbackTimer(done, NAV_LOADING_FALLBACK_MS);
    }, NAV_LOADING_SHOW_DELAY_MS);
  }, [done, setShowTimer, setFallbackTimer]);

  // ── 全站委托：内部链接点击（捕获阶段，先于链接自身的 onClick）──
  // 上一次已知的路由键（pathname+search）：popstate 在同页 #锚点 跳转时也会触发，
  // 只有键真正变化才是前进/后退路由恢复
  const routeKeyRef = useRef<string | null>(null);
  useEffect(() => {
    routeKeyRef.current = `${window.location.pathname}${window.location.search}`;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      if (!isInternalNavigation(anchor, window.location, BASE_PATH)) return;
      startNavigation();
    };
    // 前进/后退：App Router 经 popstate 恢复路由；同页 #锚点 也触发 popstate，
    // 必须比对 path+search 排除（TOC 锚点点击不应出现等待胶囊）
    const onPopState = () => {
      const key = `${window.location.pathname}${window.location.search}`;
      if (routeKeyRef.current !== key) {
        routeKeyRef.current = key;
        startNavigation();
      }
    };
    // bfcache 恢复：页面状态原样复用，保险性关掉可能残留的胶囊
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        routeKeyRef.current = `${window.location.pathname}${window.location.search}`;
        done();
      }
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [startNavigation, done]);

  // 安全网：pathname 变化即视为跳转完成（覆盖后退/前进及任何漏调 done 的路径）。
  // 仅路径真正变化时同步（外部系统状态→本组件状态），首挂载路径相同不触发 setState；
  // 同时刷新 routeKeyRef，供 popstate 区分真路由恢复与同页 hash 变化。
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    routeKeyRef.current = `${window.location.pathname}${window.location.search}`;
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      done();
    }
  }, [pathname, done]);

  // 与 <head> 原生前置脚本交接：Provider 挂载（hydration 完成）后写入标记并广播，
  // 原生点击委托自注销让位（见 lib/navigation-loading-bootstrap.ts）
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-nav-loading-ready', '');
    root.dispatchEvent(new CustomEvent('navloading:ready'));
    return () => root.removeAttribute('data-nav-loading-ready');
  }, []);

  return (
    <NavigationContext.Provider value={{ startNavigation, done }}>
      {children}
      {/* 常驻 DOM：进出场走 CSS transition，无挂载即无硬切；
          pointer-events:none 非阻塞；aria-hidden 保证隐藏态不被读屏命中 */}
      <div
        className={`nav-loading-pill glass-heavy${visible ? ' is-visible' : ''}`}
        aria-hidden={visible ? undefined : true}
      >
        <SpinRing sizeClass="w-4 h-4" gradId="nav-spin-grad" />
        <span className="nav-loading-pill__text">页面加载中…</span>
      </div>
      {/* 独立 polite live 区：仅 visible 时插入文本触发读屏播报，与视觉容器解耦 */}
      <span className="sr-only" role="status" aria-live="polite" aria-busy={visible}>
        {visible ? '页面加载中…' : ''}
      </span>
    </NavigationContext.Provider>
  );
}
