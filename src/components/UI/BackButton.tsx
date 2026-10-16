'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ArrowLink from '@/components/UI/ArrowLink';
import { getBackTarget } from '@/lib/nav-history';

/**
 * 文章页返回按钮 —— 链条确有站内上一页时返回上一页，否则回首页。
 * PostMeta 是 RSC，不能直接用 useRouter，所以抽为独立 client 组件。
 *
 * 判定不靠猜：NavHistoryTracker 在 sessionStorage 维护「本标签页实际走过的
 * 站内路由栈」，链尾前一项就是应返回的上一页。点击时（而非挂载时）读取，
 * 规避旧实现的两类移动端故障（详见 nav-history.ts 头注释）：
 *  - 切后台 pagehide 误清标记 → 软导航后误判无历史 → 回首页；
 *  - reload 后 referrer 变自身同源/标记残留 → history.back() 退到站外条目。
 *
 * SSR 输出的 href 恒为 "/"：hydration 前的点击由 <head> 内联脚本
 * back-button-bootstrap.ts 用同一链条代劳（location.assign 上一页）；
 * 无 JS 时走默认导航回首页，与设计一致。
 */
export default function BackButton() {
  const router = useRouter();

  // hydration 交接：告知 pre-hydration 内联脚本让位（与 NavigationLoadingProvider
  // 的 data-nav-loading-ready 同款模式）。文章页每次文档加载都会挂载本组件。
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-back-ready', '');
    root.dispatchEvent(new CustomEvent('backbutton:ready'));
    return () => root.removeAttribute('data-back-ready');
  }, []);

  return (
    <ArrowLink
      href="/"
      dir="back"
      backLink
      className="link-back inline-flex items-center gap-1.5 text-sm transition-colors duration-200 group/back"
      onClick={(e) => {
        // 点击时读取链条：确有站内上一页时阻止默认跳转，用 router.back()
        // 保留滚动位置；否则放行 <Link href="/"> 回首页（外站直达、无历史、
        // sessionStorage 不可用等场景）。
        // 判定与 pre-hydration 内联脚本同源同规则（同键同格式的 sessionStorage 链）。
        if (getBackTarget(window.location.pathname)) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      返回
    </ArrowLink>
  );
}
