'use client';
import { useRouter } from 'next/navigation';
import ArrowLink from '@/components/UI/ArrowLink';

/**
 * 文章页返回按钮 —— 优先返回上一页，无历史或来自外站时回首页。
 * PostMeta 是 RSC，不能直接用 useRouter，所以抽为独立 client 组件。
 */
export default function BackButton() {
  const router = useRouter();

  // history.length > 1 只说明浏览器有历史，不保证上一条是本站
  // （从搜索引擎直接打开文章页时 length 同样 > 1）。补同源 referrer
  // 判断：外站进入时不用 history.back()，走默认 <Link href="/"> 回首页。
  const canGoBack =
    typeof window !== 'undefined' &&
    window.history.length > 1 &&
    (() => {
      try {
        return new URL(document.referrer).origin === window.location.origin;
      } catch {
        return false; // referrer 为空（新标签页直达）或非法 URL
      }
    })();

  return (
    <ArrowLink
      href="/"
      dir="back"
      className="link-back inline-flex items-center gap-1.5 text-sm transition-colors duration-200 group/back"
      onClick={(e) => {
        // 有本站历史时阻止默认跳转，改用 router.back() 保留滚动位置
        if (canGoBack) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      返回
    </ArrowLink>
  );
}
