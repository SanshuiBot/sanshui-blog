/**
 * 首页（Home / 落地页）
 * -----------------------------
 * 作用：站点入口页。展示 Hero 场景，以及"最新文章"列表网格（滚动进入视口时懒加载）。
 *
 * 用法：
 *  - 服务端组件，构建时通过 getAllPosts() 从文件系统读取所有 .md 文章。
 *  - <HomeHydration> 是 client wrapper，内部 dynamic(ssr:false) 懒加载 HeroParallax 和 PostsList，
 *    避免 framer-motion 被打进首屏 chunk。
 *  - <head> 内对第一篇文章插入 <link rel="prefetch" fetchPriority="low">，
 *    低优先级、空闲时预取文章页 HTML，使点击卡片时几乎秒开。
 *    ⚠️ 不带 as="document"：带 as 会强制走高优先级文档通道，抢占首屏 JS/CSS 的 HTTP/2 并发流，
 *    导致首屏资源全部挂起（实测 48s）。去掉 as 后浏览器把它当低优先级空闲预取。
 *  - 原生 <link> 不走 Next <Link> 的 basePath 自动注入，必须用 withBase() 手动拼前缀。
 */
import { getAllPosts, getAllTags } from '@/lib/posts';
import { withBase } from '@/lib/basePath';
import HomeHydration from '@/components/Home/HomeHydration';

export default function Home() {
  const posts = getAllPosts();
  const firstPost = posts[0];

  // 首屏 Hero 统计胶囊：服务端一次性算好，避免客户端再 fetch
  const lastUpdated = posts[0]?.date ?? '';
  const stats = {
    posts: posts.length,
    tags: getAllTags().length,
    lastUpdated,
  };

  // 预取范围：仅第一篇文章（1 篇），减少 HTML 体积
  const prefetchSlugs = firstPost ? [firstPost.slug] : [];

  return (
    <>
      {/* 批量预取第一篇文章页 HTML：用户点击卡片前，目标 HTML 已在浏览器 HTTP 缓存。
          低优先级、空闲时拉取，不阻塞首屏。 */}
      {prefetchSlugs.map((slug) => (
        <link key={slug} rel="prefetch" href={withBase(`/posts/${slug}/`)} fetchPriority="low" />
      ))}
      <HomeHydration total={posts.length} stats={stats} />
    </>
  );
}
