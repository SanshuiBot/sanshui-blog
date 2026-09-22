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
      <div ref={ref} className="text-sm font-medium post-nav-title truncate">
        {title}
      </div>
    </Tooltip>
  );
}

/**
 * 聚光跟随：把鼠标坐标（百分比）原地写入卡片元素的 --mx/--my CSS 变量，
 * 纯 CSS 渲染 .post-nav-spotlight 的 radial-gradient——不进 React 状态，
 * 高频 mousemove 零重渲染（同约定 #25/#47，走原生事件而非 React 合成事件亦无必要）。
 */
function handleSpotlightMove(e: React.MouseEvent<HTMLAnchorElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
  el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
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
            className="post-nav-link relative flex h-full items-start gap-3 p-4 rounded-xl glass border border-black/[0.06] dark:border-white/5 overflow-hidden"
          >
            <span className="post-nav-spotlight" aria-hidden="true" />
            <span className="post-nav-chevron-prev">
              <ChevronLeft size={18} className="mt-0.5 post-nav-icon shrink-0" />
            </span>
            <div className="min-w-0">
              <div className="text-xs mb-1 post-nav-label">上一篇</div>
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
            className="post-nav-link relative flex h-full items-start justify-end gap-3 p-4 rounded-xl glass border border-black/[0.06] dark:border-white/5 overflow-hidden"
          >
            <span className="post-nav-spotlight" aria-hidden="true" />
            <div className="min-w-0 text-right">
              <div className="text-xs mb-1 post-nav-label">下一篇</div>
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
