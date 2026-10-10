'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useNavigationLoading } from '@/components/UI/NavigationLoading';
import SpotlightTilt from '@/components/UI/SpotlightTilt';
import Tooltip from '@/components/UI/Tooltip';
import { useIsOverflow } from '@/components/UI/useIsOverflow';
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
 * 单张上下篇卡：hover 3D tilt + 聚光坐标分发收口 SpotlightTilt
 * （同 PostCard/项目卡/友链卡，全站统一），纯 CSS 渲染 .spotlight-glow /
 * .spotlight-dye——高频 mousemove 零重渲染（约定 #25/#47）。
 */
function PostNavCard({
  href,
  slug,
  label,
  title,
  side,
}: {
  href: string;
  slug: string;
  label: string;
  title: string;
  side: 'prev' | 'next';
}) {
  const { startNavigation } = useNavigationLoading();
  const isPrev = side === 'prev';

  return (
    <div className="post-nav-card group h-full">
      <SpotlightTilt
        dyedSelector=".post-nav-title, .post-nav-label"
        className="h-full"
        tiltClassName="h-full"
      >
        <Link
          href={href}
          prefetch={false}
          onClick={startNavigation}
          className={`post-nav-link spotlight-card relative flex h-full items-start gap-3 p-4 rounded-xl glass border border-black/[0.06] dark:border-white/5 overflow-hidden ${
            isPrev ? '' : 'justify-end'
          }`}
        >
          {/* 边框发光层 + 光晕层（公共收口 styles/spotlight.css；半透明玻璃卡面，两层排内容之前即可透出） */}
          <span className="spotlight-border-glow" aria-hidden="true" />
          <span className="spotlight-glow" aria-hidden="true" />
          {isPrev ? (
            <span className="post-nav-chevron-prev">
              <ChevronLeft size={18} className="mt-0.5 post-nav-icon shrink-0" />
            </span>
          ) : null}
          <div className={`min-w-0 ${isPrev ? '' : 'text-right'}`}>
            <div className="text-xs mb-1 post-nav-label spotlight-dye">{label}</div>
            {/* key=slug：换文章时 props 变化但组件可能被复用，重挂载才能重测溢出
                （title 不能作 key：两篇文章标题可能相同而 slug 不同，复用会沿用旧溢出测量） */}
            <TruncatedTitle key={slug} title={title} />
          </div>
          {isPrev ? null : (
            <span className="post-nav-chevron-next">
              <ChevronRight size={18} className="mt-0.5 post-nav-icon shrink-0" />
            </span>
          )}
        </Link>
      </SpotlightTilt>
    </div>
  );
}

export default function PostNav({ prev, next }: Props) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="上下篇导航">
      {prev ? (
        <PostNavCard
          href={`/posts/${prev.slug}/`}
          slug={prev.slug}
          label="上一篇"
          title={prev.title}
          side="prev"
        />
      ) : (
        <div />
      )}
      {next ? (
        <PostNavCard
          href={`/posts/${next.slug}/`}
          slug={next.slug}
          label="下一篇"
          title={next.title}
          side="next"
        />
      ) : (
        <div />
      )}
    </nav>
  );
}
