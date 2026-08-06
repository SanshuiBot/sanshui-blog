'use client';
import { useEffect, useState, useRef, type RefObject } from 'react';
import { thumbGeometry, type ThumbGeometry } from '@/lib/thumbGeometry';

/**
 * TOC 滚动指示条几何 —— 把「几何公式」与「何时重算几何」收进同一可测模块。
 *
 * 解耦前的 locality 断裂：`thumbGeometry` 纯函数有测，副作用编排
 * （rAF 防抖 / ResizeObserver / fonts.ready）无测，`e6735f8` 修的越界 bug
 * 就在无测的那层。详见 `docs/adr/0001-toc-thumb-geometry-deepening.md`。
 *
 * 编排要点：
 *  - **rAF 防抖**：ResizeObserver 与 scroll 多次触发合并到下一帧（`useRef`
 *    持 ID，effect cleanup `cancelAnimationFrame`）。
 *  - **`document.fonts.ready` 只留一次**：冷启动兜底——字体加载触发 reflow
 *    后重算。删原实现的第二次 `.then(() => update())`：`update` 只读尺寸不
 *    写布局，连跑两次是冗余。
 *  - **不监 `items` 依赖**：thumb 几何只依赖容器尺寸，不直接依赖 TOC 条目。
 *    换文章时 `items` 变 → `<ul>` 重渲染 → 容器高度变 → ResizeObserver 捕获。
 *    换文章瞬间 thumb 的一帧错位不可见（hover 才显隐，换文章时鼠标不在 TOC 上），
 *    不为看不见的窗口加同步路径。
 *
 * 显隐（`thumbVisible`）**不**收进本 hook——显隐只由 hover 控制，跟几何重算
 * 没有共生命周期，强行合并会让接口比「两个分离的 useState」还复杂。
 *
 * @param ref 滚动容器 ref（`overflow-y: auto` 且内容可能超出的节点）
 * @returns `{ thumb }` —— `null` 表示内容未超出视口、无需浮层
 */
export function useScrollThumbGeometry(ref: RefObject<HTMLElement | null>): {
  thumb: ThumbGeometry | null;
} {
  const [thumb, setThumb] = useState<ThumbGeometry | null>(null);
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const update = () => {
      setThumb(thumbGeometry(container.clientHeight, container.scrollHeight, container.scrollTop));
    };

    const schedule = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    // 首帧延一帧算准布局
    schedule();

    // 字体加载后 reflow 一次冷启动兜底（删原实现的第二次 `.then(()=>update())`，
    // `update` 只读尺寸不写布局，连跑两次是冗余）
    const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    if (fonts?.ready) {
      fonts.ready.then(update).catch(() => {
        /* 字体加载失败不阻塞 thumb 几何 */
      });
    }

    // ResizeObserver：容器或内容尺寸变时重算（缩放窗 / 新内容）
    const ro = new ResizeObserver(schedule);
    ro.observe(container);
    const firstChild = container.firstElementChild;
    if (firstChild) ro.observe(firstChild as Element);

    // scroll 时重算 thumb 几何（位置随滚动变），rAF 合并到下一帧
    container.addEventListener('scroll', schedule, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      ro.disconnect();
      container.removeEventListener('scroll', schedule);
    };
  }, [ref]);

  return { thumb };
}
