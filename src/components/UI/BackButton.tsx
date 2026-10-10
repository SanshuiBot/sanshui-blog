'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ArrowLink from '@/components/UI/ArrowLink';

/**
 * 文章页返回按钮 —— 优先返回上一页，无历史或来自外站时回首页。
 * PostMeta 是 RSC，不能直接用 useRouter，所以抽为独立 client 组件。
 *
 * 「上一条历史是本站」的判定（两个信号，任一成立即走 history.back()）：
 *  1. 同源 referrer：站内 <Link> 导航/刷新都会带上；
 *  2. 站内会话标记（sessionStorage 'sansui-in-site-nav'）：本站任意页面挂载时写入、
 *     页面卸载（离开本站）时清除。referrer 为空（新标签页内先开首页再点进文章）
 *     但本次会话确实从本站页面导航而来时，靠它正确 back，修复「总是回首页」。
 * 搜索引擎/直接粘 URL 进新标签页：两信号皆无 → 走默认 <Link href="/"> 回首页
 * （此时 history.back() 会退到站外，不可用）。
 */
export const IN_SITE_NAV_KEY = 'sansui-in-site-nav';

export function markInSiteNav(): void {
  try {
    sessionStorage.setItem(IN_SITE_NAV_KEY, '1');
  } catch {
    /* sessionStorage 不可用（隐私模式等）时静默降级：仅靠 referrer 信号 */
  }
}

export function clearInSiteNav(): void {
  try {
    sessionStorage.removeItem(IN_SITE_NAV_KEY);
  } catch {
    /* 同上 */
  }
}

function computeCanGoBack(): boolean {
  if (typeof window === 'undefined' || window.history.length <= 1) return false;
  // history.length > 1 只说明浏览器有历史，不保证上一条是本站，须叠加本站信号
  let referrerInSite = false;
  try {
    referrerInSite = new URL(document.referrer).origin === window.location.origin;
  } catch {
    referrerInSite = false; // referrer 为空（新标签页直达）或非法 URL
  }
  if (referrerInSite) return true;
  let inSiteNav = false;
  try {
    inSiteNav = sessionStorage.getItem(IN_SITE_NAV_KEY) === '1';
  } catch {
    inSiteNav = false;
  }
  return inSiteNav;
}

export default function BackButton() {
  const router = useRouter();
  // 惰性初始化：SSR 阶段无 window 恒为 false；客户端首帧读一次真实历史。
  // 判定结果只影响 onClick 行为、不影响 SSR 输出标记，无 hydration mismatch 风险。
  const [canGoBack] = useState(computeCanGoBack);

  return (
    <ArrowLink
      href="/"
      dir="back"
      className="link-back inline-flex items-center gap-1.5 text-sm transition-colors duration-200 group/back"
      onClick={(e) => {
        // 有本站历史时阻止默认跳转，改用 router.back() 保留滚动位置
        if (canGoBack) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      返回
    </ArrowLink>
  );
}
