'use client';
/**
 * 文章卡片网格 + 流式渐进渲染
 * -----------------------------
 * 统一封装首页 / 归档 / 标签详情页的「文章卡片网格」渲染：
 *  - 接收 `posts` 数组（已就绪数据，RSC 透传或客户端 fetch 结果）
 *  - 接收 `total`：网格槽位总数。`total` > `posts.length` 时，超出部分显示骨架占位
 *    （首页 fetch 未完成、归档按年分组但总数已知等场景）
 *  - 挂载后从第 0 张起逐张把骨架替换成真实卡片，每张间隔 80ms
 *  - 用户视觉上是「文章一个一个冒出来」，不是「一堆骨架突然变一堆卡片」
 *
 * 设计取舍：
 *  - 骨架数量 = max(total, posts.length)，确保数据未到时也有占位
 *  - `filled` 状态驱动逐张揭示；卸载时清定时器（AGENTS.md #20 幂等清理）
 *  - 骨架 key 用 `skel-${i}`，卡片 key 用 `p.slug`，避免骨架/卡片切换时 DOM 复用错乱
 */
import { useEffect, useState, useRef } from 'react';
import PostCard from '@/components/Post/PostCard';
import type { Post } from '@/lib/types';

interface Props {
  /** 已就绪的文章数组（RSC 透传或客户端 fetch 结果） */
  posts: Post[];
  /** 网格槽位总数；默认 = posts.length */
  total?: number;
}

/** 骨架卡片——与 PostCard 视觉尺寸对齐，animate-pulse 给「正在加载」信号 */
function SkeletonCard() {
  return (
    <div
      className="h-52 rounded-2xl bg-white/10 animate-pulse overflow-hidden relative"
      aria-hidden="true"
    >
      {/* 模拟卡片顶部渐变条 */}
      <div className="h-[2px] bg-white/10 w-full" />
      {/* 模拟标签占位 */}
      <div className="px-5 pt-4 flex gap-1.5">
        <div className="h-4 w-10 rounded-full bg-white/10" />
        <div className="h-4 w-8 rounded-full bg-white/10" />
      </div>
      {/* 模拟标题占位 */}
      <div className="px-5 pt-3">
        <div className="h-5 w-full rounded bg-white/10 mb-2" />
        <div className="h-4 w-3/4 rounded bg-white/10" />
      </div>
      {/* 模拟底部分隔线 */}
      <div className="px-5 pt-4 mt-auto">
        <div className="h-px w-full bg-white/10" />
      </div>
    </div>
  );
}

export default function PostGrid({ posts, total }: Props) {
  const slotCount = total ?? posts.length;
  /** 已「填充」成真实卡片的数量；< posts.length 时，后面的位置仍是骨架 */
  const [filled, setFilled] = useState(0);
  // 流式填充定时器引用，卸载时清
  const fillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 数据到了：从第 0 张起逐张填充，每张间隔 80ms
  useEffect(() => {
    if (filled >= posts.length) return;
    fillTimerRef.current = setTimeout(() => setFilled((n) => n + 1), 80);
    return () => {
      if (fillTimerRef.current) clearTimeout(fillTimerRef.current);
    };
  }, [posts, filled]);

  // 渲染槽位：已填充的显示真实卡片，未填充的显示骨架
  const slots = Array.from({ length: slotCount }, (_, i) => {
    if (i < filled && i < posts.length) {
      const p = posts[i]!;
      return <PostCard key={p.slug} post={p} index={i} />;
    }
    // 同 i 下的骨架需要稳定 key，避免骨架/卡片切换时 DOM 复用错乱
    return <SkeletonCard key={`skel-${i}`} />;
  });

  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{slots}</div>;
}
