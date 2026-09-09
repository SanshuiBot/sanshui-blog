'use client';
import { useEffect } from 'react';

/**
 * 模态/抽屉打开时锁定 body 滚动 —— 全站唯一实现。
 * -----------------------------
 * 之前 Navbar（移动菜单抽屉）与 SearchModal 各自手写
 * 「记录 prevOverflow → hidden → cleanup 还原」的同一段逻辑，
 * 且两者同时打开时还原会互相覆盖（抽屉开着再开搜索，关搜索会把
 * 抽屉设置的 hidden 一并还原掉）。收口后：
 *  - 每次激活都记录自己的 prev，cleanup 只还原自己设置前的值
 *  - 幂等：重复激活不叠加副作用（React 19 strict 双执行安全）
 *
 * iOS Safari 兼容：`overflow: hidden` 在 iOS 上无法阻止背景滚动，
 * 需要额外用 `position: fixed` + 负 top 偏移锁定视口位置。该方案仅在
 * iOS/触摸设备启用——桌面端 fixed 会移除滚动条导致内容横向跳动
 * （width:100% 不补偿 ~17px 滚动条宽度），桌面保持纯 overflow: hidden。
 */

/** iOS 或触摸设备判定：iOS Safari 必须 fixed 方案才能锁住背景滚动 */
function needsFixedLock(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ 伪装成桌面 Safari（Macintosh + 触摸），用 maxTouchPoints 识别
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
  return isIOS || navigator.maxTouchPoints > 0;
}

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (needsFixedLock()) {
      const prevPosition = document.body.style.position;
      const prevTop = document.body.style.top;
      const prevWidth = document.body.style.width;
      scrollY = window.scrollY;
      // iOS Safari 兼容：fixed 定位锁定视口，负 top 保持视觉位置不变
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.position = prevPosition;
        document.body.style.top = prevTop;
        document.body.style.width = prevWidth;
        // 还原滚动位置（fixed 定位期间 scrollY 被重置为 0）
        window.scrollTo(0, scrollY);
      };
    }

    // 桌面端：纯 overflow: hidden 即可锁住滚动，无副作用
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);
}
