'use client';
import { useEffect } from 'react';

/**
 * 首页「刷新后回到顶部」修复 —— 刷新滚动还原。
 * -----------------------------
 * 根因：首页内容全部异步渲染（HeroParallax / PostsList 均为
 * dynamic(ssr:false)），刷新时浏览器原生滚动恢复执行时文档只有一屏高
 * （Hero 占位 + 骨架），恢复位置被 clamp 到 0；异步内容撑开文档后
 * 没有任何机制补恢复，于是停在顶部。
 *
 * 接管方案：
 *  - 保存：pagehide（真实刷新/关闭，移动端可靠）+ visibilitychange(hidden)
 *    （后台被系统回收的兜底）时把 {path, y} 写入 sessionStorage。
 *  - 消费：挂载时读取并按 rAF 轮询文档高度，等能容纳刷新前位置时
 *    scrollTo 还原；2s 超时按当前最大可滚位置尽力还原（内容可能变少）。
 *  - 清理：SPA 离开首页（卸载）时清 key，避免过期位置污染下次 SPA
 *    返回首页时的滚动（那种场景由 Next 的 popstate 恢复接管）。
 *    不在读取时删除 key：StrictMode 双挂载会先消费后重挂，读时删除
 *    会让第二次挂载拿不到值（dev 下还原失效）。
 *
 * bfcache 恢复（前进/后退回到本页）不重跑 effect，天然跳过；
 * 滚动位置在顶部（y=0）时无 key/值为 0，整个流程零开销。
 */

const STORAGE_KEY = 'sansui-home-scroll-restore';

interface SavedScroll {
  path: string;
  y: number;
}

function readSaved(path: string): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Partial<SavedScroll>;
    return parsed.path === path && typeof parsed.y === 'number' && parsed.y > 0 ? parsed.y : 0;
  } catch {
    return 0;
  }
}

/** 还原超时：rAF 轮询文档高度最多等这么久（异步 chunk + fetch + 流式填充的余量） */
const RESTORE_TIMEOUT_MS = 2000;

export function useReloadScrollRestore(): void {
  useEffect(() => {
    const path = window.location.pathname;

    const save = () => {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ path, y: window.scrollY } satisfies SavedScroll),
        );
      } catch {
        /* sessionStorage 不可用（隐私模式等），还原退化为浏览器默认行为 */
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save();
    };
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', onVisibility);

    const savedY = readSaved(path);
    let raf = 0;
    if (savedY > 0) {
      const start = Date.now();
      const tick = () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        // 高度足够：精确还原；超时：按当前最大可滚位置尽力还原
        if (maxScroll >= savedY || Date.now() - start > RESTORE_TIMEOUT_MS) {
          window.scrollTo(0, Math.min(savedY, Math.max(maxScroll, 0)));
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', onVisibility);
      // SPA 离开首页时清 key，过期位置不带入下次挂载（见文件头）
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* 同上 */
      }
    };
  }, []);
}
