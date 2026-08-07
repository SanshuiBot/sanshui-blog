/**
 * Posts 列表懒加载组件
 * -----------------------------
 * 首页 Hero 只展示身份信息，文章卡片由本组件在客户端懒加载。
 *
 * 原理：
 *  - 首页 HTML 不再包含所有 PostCard 的 RSC payload（节省 ~233KB）
 *  - 本组件用 dynamic(ssr:false) 在 HomeHydration 里懒加载
 *  - 挂载后立即 fetch posts-index.json（~8KB，缓存友好），再渲染卡片
 *  - 卡片入场用 whileInView 滚动触发动画，用户滚到那里才看到
 *  - 整个 section 随滚动淡入（opacity/y），与 Hero 淡出 overlap，避免空白期
 *
 * 流式渐进渲染：
 *  - 数据未到：显示 `total` 张骨架占位
 *  - 数据到了：交给 <PostGrid> 逐张填充，每张间隔 80ms
 *  - 用户视觉上是「文章一个一个冒出来」，不是「一堆骨架突然变一堆卡片」
 *
 * 数据源：posts-index.json（与 SearchModal 共享，第一次 fetch 后浏览器缓存）
 */
'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import PostGrid from '@/components/Post/PostGrid';
import { withBase } from '@/lib/basePath';
import type { PostIndexEntry } from '@/lib/post-index';
import type { Post } from '@/lib/types';

interface Props {
  /** 总文章数，用于显示计数 */
  total: number;
}

export default function PostsList({ total }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-40px' });
  // ref 防止并发重复请求
  const fetchRef = useRef(false);

  const loadPosts = () => {
    if (fetchRef.current) return;
    fetchRef.current = true;
    fetch(withBase('/posts-index.json'))
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: PostIndexEntry[]) => {
        // PostGrid 期望 Post[]；PostIndexEntry 字段集是 Post 的子集，
        // 补 content 空串以满足类型（PostCard 不读 content）
        setPosts(data as unknown as Post[]);
      })
      .catch(() => setError(true))
      .finally(() => {
        fetchRef.current = false;
      });
  };

  // 挂载后立即加载，不依赖 inView 门控
  useEffect(() => {
    loadPosts();
  }, []);

  if (error) {
    return (
      <section
        ref={sectionRef}
        id="posts"
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
      >
        <div className="text-center py-16 text-gray-500">文章列表加载失败，请刷新页面</div>
      </section>
    );
  }

  return (
    <motion.section
      ref={sectionRef}
      id="posts"
      className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
    >
      {/* 标题：滚动入场淡入 */}
      <div ref={titleRef} className="flex items-end justify-between mb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">最新文章</h2>
          <p className="mt-2 text-gray-500 text-sm">共 {total} 篇文章</p>
        </motion.div>
      </div>

      {/* total 槽位：fetch 未完时 total 张骨架，数据到后 PostGrid 逐张填充 */}
      <PostGrid posts={posts} total={total} />
    </motion.section>
  );
}
