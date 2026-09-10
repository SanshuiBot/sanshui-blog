import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { siteConfig } from '@/lib/site';

// 站点 URL 唯一来源 siteConfig.url（= SITE_ORIGIN + BASE_PATH，双端部署自动跟随：
// GitHub 端 https://sanshuibot.github.io/sanshui-blog、CF 端由环境变量覆盖）。
const baseUrl = siteConfig.url;

// 配合 output: 'export' 静态导出：显式声明 force-static，
// 否则 Next 默认按 dynamic 处理，导出时报错。
// 注意：不能同时写 revalidate = 0 —— revalidate:0 会强制动态渲染，
// 覆盖 force-static，导致 sitemap.xml 不被导出（此前是 latent bug）。
export const dynamic = 'force-static' as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const postEntries = posts.map((post) => ({
    // 中文 slug 必须百分号编码，否则 sitemap.xml 非法、部分爬虫拒绝解析
    url: `${baseUrl}/posts/${encodeURIComponent(post.slug)}/`,
    lastModified: post.date,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // static page lastModified 用固定日期避免每次 build 产生 git 噪音。
  // 取最新文章日期作为静态页面"上次更新"基准，语义更清晰。
  const fixedLastModified = posts.length > 0 ? posts[0]!.date : '1970-01-01';

  const staticPages = [
    {
      url: baseUrl,
      lastModified: fixedLastModified,
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/archive/`,
      lastModified: fixedLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tags/`,
      lastModified: fixedLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about/`,
      lastModified: fixedLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/projects/`,
      lastModified: fixedLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/links/`,
      lastModified: fixedLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [...staticPages, ...postEntries];
}
