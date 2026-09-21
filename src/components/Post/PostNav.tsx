'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useNavigationLoading } from '@/components/UI/NavigationLoading';
import Tooltip from '@/components/UI/Tooltip';
import { useIsOverflow } from '@/components/UI/useIsOverflow';

interface Props {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

/**
 * 标题 hover 提示：只在标题真的被 truncate 截断时才显示完整标题气泡。
 * Tooltip 只包标题 div——hover 卡片其他区域（chevron/留白）不触发。
 * 截断检测用 useIsOverflow（mount/resize 实测），hover 时 disabled 已就绪，
 * 第一次 hover 即可弹气泡（不能放 onMouseEnter 里测：同批次 setState 未提交）。
 */
function TruncatedTitle({ title }: { title: string }) {
  const { ref, overflow } = useIsOverflow<HTMLDivElement>('x');

  return (
    <Tooltip label={title} disabled={!overflow} offsetX={8} offsetY={10}>
      <div ref={ref} className="text-sm font-medium text-neutral-400 post-nav-title truncate">
        {title}
      </div>
    </Tooltip>
  );
}

export default function PostNav({ prev, next }: Props) {
  const { startNavigation } = useNavigationLoading();
  if (!prev && !next) return null;

  return (
    <nav className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="上下篇导航">
      {prev ? (
        <div className="post-nav-card">
          <Link
            href={`/posts/${prev.slug}/`}
            prefetch={false}
            onClick={startNavigation}
            className="group flex items-start gap-3 p-4 rounded-xl glass border border-black/[0.06] dark:border-white/5 transition-all duration-300 group-hover:border-accent-violet/30 relative overflow-hidden"
          >
            <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-accent-violet/0 group-hover:bg-accent-violet/60 transition-colors duration-300" />
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent-violet/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="post-nav-chevron-prev">
              <ChevronLeft size={18} className="mt-0.5 post-nav-icon shrink-0" />
            </span>
            <div className="min-w-0">
              <div className="text-xs text-neutral-500 mb-1 post-nav-label">上一篇</div>
              {/* key=slug：换文章时 props 变化但组件可能被复用，重挂载才能重测溢出 */}
              <TruncatedTitle key={prev.slug} title={prev.title} />
            </div>
          </Link>
        </div>
      ) : (
        <div />
      )}
      {next ? (
        <div className="post-nav-card sm:col-start-2">
          <Link
            href={`/posts/${next.slug}/`}
            prefetch={false}
            onClick={startNavigation}
            className="group flex items-start justify-end gap-3 p-4 rounded-xl glass border border-black/[0.06] dark:border-white/5 transition-all duration-300 group-hover:border-accent-violet/30 relative overflow-hidden"
          >
            <span className="absolute right-0 top-0 bottom-0 w-[3px] rounded-r-xl bg-accent-violet/0 group-hover:bg-accent-violet/60 transition-colors duration-300" />
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-accent-violet/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="min-w-0 text-right">
              <div className="text-xs text-neutral-500 mb-1 post-nav-label">下一篇</div>
              <TruncatedTitle key={next.slug} title={next.title} />
            </div>
            <span className="post-nav-chevron-next">
              <ChevronRight size={18} className="mt-0.5 post-nav-icon shrink-0" />
            </span>
          </Link>
        </div>
      ) : (
        <div />
      )}
    </nav>
  );
}
