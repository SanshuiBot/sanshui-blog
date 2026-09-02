import type { MetadataRoute } from 'next';
import { BASE_PATH } from '@/lib/basePath';
import { getAllPosts } from '@/lib/posts';

const baseUrl = 'https://sanshuibot.github.io' + BASE_PATH;

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
  // 取最新文章日期的前一天作为静态页面"上次更新"基准，语义合理且确定。
  const fixedLastModified =
    posts.length > 0
      ? (() => {
          const d = new Date(posts[0]!.date);
          d.setDate(d.getDate() - 1);
          return d.toISOString();
        })()
      : '1970-01-01T00:00:00.000Z';

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
