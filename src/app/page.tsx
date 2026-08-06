/**
 * 首页（Home / 落地页）
 * -----------------------------
 * 作用：站点入口页。展示 Hero 场景、站点统计、置顶精选文章，以及"最新文章"列表网格。
 *
 * 用法：
 *  - 服务端组件，构建时通过 getAllPosts() 从文件系统读取所有 .md 文章。
 *  - 第一篇文章作为 Featured（精选）单独渲染，其余进入 3 列网格。
 *  - <head> 内对每篇文章插入 <link rel="prefetch" as="document">，
 *    低优先级、空闲时预取文章页 HTML，使点击卡片时几乎秒开。
 *  - 原生 <link> 不走 Next <Link> 的 basePath 自动注入，必须用 withBase() 手动拼前缀。
 */
import { getAllPosts } from '@/lib/posts';
import { withBase } from '@/lib/basePath';
import PostCard from '@/components/Post/PostCard';
import HomeHydration from '@/components/Home/HomeHydration';
import FeaturedPost from '@/components/Home/FeaturedPost';
import ArrowLink from '@/components/UI/ArrowLink';

export default function Home() {
  const posts = getAllPosts();
  const featured = posts[0];
  const remaining = posts.slice(1);

  // 预取范围：首屏可见的 6 篇（featured + 5 张卡片），其余不预取。
  // 此前预取全部 23 篇，23 个 <link> 撑大首页 HTML 且抢占 HTTP/2 流；
  // 改后 HTML 显著瘦身，且首屏卡片点击仍秒开（已预取）。
  const prefetchSlugs = posts.slice(0, 6).map((p) => p.slug);

  return (
    <>
      {/* 批量预取首屏可见的文章页 HTML：用户点击卡片前，目标 HTML 已在浏览器 HTTP 缓存。
          低优先级、空闲时拉取，不阻塞首屏。
          原生 <link> 标签不走 Next <Link> 的 basePath 自动注入，必须手动拼。
          注意：不能用 <head> 包裹——App Router 下 <head> 嵌在 <main> 里会触发
          hydration 错误（<head> cannot be a child of <main>）。<link rel="prefetch">
          允许出现在文档任意位置，浏览器同样识别。
          ⚠️ 不带 as="document"：带 as 会强制走高优先级文档通道，抢占首屏 JS/CSS
          的 HTTP/2 并发流，导致首屏资源全部挂起（实测 48s）。去掉 as 后浏览器
          把它当低优先级空闲预取，首屏不再被挤占。 */}
      {prefetchSlugs.map((slug) => (
        <link key={slug} rel="prefetch" href={withBase(`/posts/${slug}/`)} fetchPriority="low" />
      ))}
      <HomeHydration />
      {featured && <FeaturedPost post={featured} />}
      <section id="posts" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">最新文章</h2>
            <p className="mt-2 text-gray-500 text-sm">共 {posts.length} 篇文章</p>
          </div>
          <ArrowLink
            href="/archive/"
            dir="more"
            className="link-more hidden sm:inline-flex items-center gap-1.5 text-sm font-medium "
          >
            查看全部
          </ArrowLink>
        </div>
        {remaining.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {remaining.map((p, i) => (
              <PostCard key={p.slug} post={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-600">暂无更多文章</div>
        )}
        <div className="sm:hidden mt-8 text-center">
          <ArrowLink
            href="/archive/"
            dir="more"
            className="link-more inline-flex items-center gap-1.5 text-sm font-medium "
          >
            查看全部文章
          </ArrowLink>
        </div>
      </section>
    </>
  );
}
