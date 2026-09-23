'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useNavigationLoading } from '@/components/UI/NavigationLoading';
import Tooltip from '@/components/UI/Tooltip';
import { useIsOverflow } from '@/components/UI/useIsOverflow';
import { spotlightMove } from '@/lib/spotlight';
import '@/styles/spotlight.css';

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
      <div ref={ref} className="text-sm font-medium post-nav-title truncate spotlight-dye">
        {title}
      </div>
    </Tooltip>
  );
}

/**
 * 聚光跟随：经 lib/spotlight.ts 写入坐标（卡片根供光晕层、染色元素按自身盒供染色层，
 * 统一 px），纯 CSS 渲染 .spotlight-glow / .spotlight-dye——不进 React 状态，
 * 高频 mousemove 零重渲染（约定 #25/#47）。
 */
function handleSpotlightMove(e: React.MouseEvent<HTMLAnchorElement>) {
  spotlightMove(e.currentTarget, e, '.post-nav-title, .post-nav-label');
}

export default function PostNav({ prev, next }: Props) {
  const { startNavigation } = useNavigationLoading();
  if (!prev && !next) return null;

  return (
    <nav className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="上下篇导航">
      {prev ? (
        <div className="post-nav-card group">
          <Link
            href={`/posts/${prev.slug}/`}
            prefetch={false}
            onClick={startNavigation}
            onMouseMove={handleSpotlightMove}
            className="post-nav-link spotlight-card relative flex h-full items-start gap-3 p-4 rounded-xl glass border border-black/[0.06] dark:border-white/5 overflow-hidden"
          >
            <span className="spotlight-glow" aria-hidden="true" />
            <span className="post-nav-chevron-prev">
              <ChevronLeft size={18} className="mt-0.5 post-nav-icon shrink-0" />
            </span>
            <div className="min-w-0">
              <div className="text-xs mb-1 post-nav-label spotlight-dye">上一篇</div>
              {/* key=slug：换文章时 props 变化但组件可能被复用，重挂载才能重测溢出 */}
              <TruncatedTitle key={prev.slug} title={prev.title} />
            </div>
          </Link>
        </div>
      ) : (
        <div />
      )}
      {next ? (
        <div className="post-nav-card group sm:col-start-2">
          <Link
            href={`/posts/${next.slug}/`}
            prefetch={false}
            onClick={startNavigation}
            onMouseMove={handleSpotlightMove}
            className="post-nav-link spotlight-card relative flex h-full items-start justify-end gap-3 p-4 rounded-xl glass border border-black/[0.06] dark:border-white/5 overflow-hidden"
          >
            <span className="spotlight-glow" aria-hidden="true" />
            <div className="min-w-0 text-right">
              <div className="text-xs mb-1 post-nav-label spotlight-dye">下一篇</div>
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
