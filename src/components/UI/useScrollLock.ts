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
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
