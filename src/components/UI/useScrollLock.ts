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
 * iOS 设备启用——Android 等其余触屏设备 overflow: hidden 即可锁住
 * 背景滚动，不需要 fixed；桌面端 fixed 会移除滚动条导致内容横向跳动
 * （width:100% 不补偿 ~17px 滚动条宽度），保持纯 overflow: hidden。
 *
 * 滚动位置捕获时序（历史 bug，勿改回）：必须在设置 position: fixed
 * **之前**读取 window.scrollY —— fixed 一旦生效，文档滚动高度立即归零，
 * window.scrollY 随之变 0；之后再读只能拿到 0，负 top 失效（页面视觉
 * 直接弹回顶部）、关闭时 scrollTo(0, 0) 也还原不到原位置。
 * 另外 scrollY 是 window 的只读 WebIDL 属性（原型 getter、无 setter），
 * 不能用 `scrollY = ...` 裸赋值来「保存」——严格模式下抛 TypeError，
 * 宽松模式下静默失败。必须用局部变量捕获。
 */

/** 仅 iOS（含 iPadOS 13+ 伪装桌面 Safari）需要 fixed 方案锁背景滚动 */
function needsFixedLock(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ 伪装成桌面 Safari（Macintosh + 触摸），用 maxTouchPoints 识别
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))
  );
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
      // fixed 生效前捕获：见文件头「滚动位置捕获时序」
      const savedY = window.scrollY;
      // iOS Safari 兼容：fixed 定位锁定视口，负 top 保持视觉位置不变
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.position = prevPosition;
        document.body.style.top = prevTop;
        document.body.style.width = prevWidth;
        // 还原滚动位置（fixed 定位期间 scrollY 被重置为 0）。
        // 必须绕过 html 的 scroll-behavior: smooth：否则 WebKit（iOS Safari）会把
        // 这次程序化滚动动画化——关闭弹窗/抽屉时页面自行滑动一段再停回原位（历史 bug）。
        // 临时把根元素 scroll-behavior 覆盖为 auto（inline 优先于 stylesheet），
        // scrollTo 后还原；比 behavior:'instant' 兼容更广（旧 Safari 不识 instant 会回落 CSS smooth）。
        const root = document.documentElement;
        const prevBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        try {
          void root.offsetHeight; // 强制样式重算，确保 scrollTo 按 auto 解析
          window.scrollTo(0, savedY);
        } finally {
          // 无论 scrollTo 是否异常都必须还原内联覆盖——否则 <html> 永久残留
          // scroll-behavior: auto，全站平滑滚动被静默禁用直到刷新
          root.style.scrollBehavior = prevBehavior;
        }
      };
    }

    // 其余设备：纯 overflow: hidden 即可锁住滚动，无副作用
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);
}
