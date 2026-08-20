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
 * 「跟手」流式渲染的关键（AGENTS.md #15 / 约定 #11a）：
 *  - 每个槽位始终渲染**同一个** `<PostCard>` 实例，`skeleton` prop 控制骨架/卡片形态
 *  - 骨架层与卡片层共享同一 DOM 挂载点，opacity 同步过渡，**没有先卸载骨架再挂载卡片的空白帧**
 *  - 卡片入场动画从挂载即播放（PostCard 内 animate），不等 whileInView，跟手
 *
 * 设计取舍：
 *  - 骨架数量 = max(total, posts.length)，确保数据未到时也有占位
 *  - `filled` 状态驱动逐张揭示；卸载时清定时器（AGENTS.md #20 幂等清理）
 *  - 槽位 key 用 `slot-${i}` 稳定不变，骨架→卡片切换不会触发 DOM 卸载/重挂
 */
import { useEffect, useState, useRef, memo } from 'react';
import PostCard from '@/components/Post/PostCard';
import type { PostIndexEntry } from '@/lib/post-index';

interface Props {
  /** 已就绪的文章数组（RSC 透传或客户端 fetch 结果） */
  posts: PostIndexEntry[];
  /** 网格槽位总数；默认 = posts.length */
  total?: number;
}

/**
 * 单个槽位——骨架与卡片共享同一 DOM 挂载点。
 *
 * 行为：
 *  - `skeleton === true`：PostCard 渲染骨架层（卡片内容不挂载）
 *  - `skeleton` 切到 false：骨架层 opacity 渐隐 + 卡片层 opacity 渐显同步过渡
 *
 * key 在父级用 `slot-${i}` 稳定不变，所以骨架→卡片切换不会触发 DOM 卸载/重挂，
 * 也就没有「骨架消失、卡片还没出现」的空白帧。
 *
 * React.memo：流式填充每 80ms tick 只改变一个槽位的 skeleton 标志，其余槽位的
 * props（post 引用稳定 + skeleton 未变）全部命中 memo 跳过重渲染——
 * 把每 tick 的 O(槽位数) 全量重渲染降为 O(1)（只重渲染刚填充的那张卡片）。
 * 不改变任何 DOM 行为，只跳过无变化的 re-render。
 */
const SKELETON_PLACEHOLDER: PostIndexEntry = {
  slug: '',
  title: '',
  excerpt: '',
  date: '',
  tags: [],
};

const Slot = memo(function Slot({ post, skeleton }: { post?: PostIndexEntry; skeleton: boolean }) {
  // 骨架模式下 post 可能不存在，传安全占位对象满足类型；
  // PostCard 内部对所有字段做了 ??/slice 兜底，不会出现 undefined 渲染
  const safePost = skeleton && !post ? SKELETON_PLACEHOLDER : (post ?? SKELETON_PLACEHOLDER);
  return <PostCard post={safePost} skeleton={skeleton} />;
});

export default function PostGrid({ posts, total }: Props) {
  const slotCount = total ?? posts.length;
  /** 已「填充」成真实卡片的数量；< posts.length 时，后面的位置仍是骨架 */
  const [filled, setFilled] = useState(0);
  // 流式填充定时器引用，卸载时清
  const fillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 动态间隔：文章多时加快（最短 30ms），文章少时保持舒缓（最长 100ms）
  // 公式：max(30, Math.min(100, 3000 / posts.length))
  const interval = Math.max(30, Math.min(100, Math.floor(3000 / Math.max(posts.length, 1))));

  // 数据到了：从第 0 张起逐张填充
  useEffect(() => {
    if (filled >= posts.length) return;
    fillTimerRef.current = setTimeout(() => setFilled((n) => n + 1), interval);
    return () => {
      if (fillTimerRef.current) clearTimeout(fillTimerRef.current);
    };
  }, [posts, filled, interval]);

  // 渲染槽位：每个槽位始终是同一个 <Slot> 实例（key=slot-${i} 稳定）
  // i < filled 且有对应 post → 显示真实卡片；否则显示骨架
  const slots = Array.from({ length: slotCount }, (_, i) => {
    const hasPost = i < posts.length;
    const isFilled = i < filled && hasPost;
    return <Slot key={`slot-${i}`} post={hasPost ? posts[i] : undefined} skeleton={!isFilled} />;
  });

  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{slots}</div>;
}
