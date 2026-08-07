import type { MetadataRoute } from 'next';
import { BASE_PATH } from '@/lib/basePath';
import { getAllPosts } from '@/lib/posts';

const baseUrl = 'https://sanshuibot.github.io' + BASE_PATH;

// 配合 output: 'export' 静态导出：显式声明 force-static，
// 否则 Next 默认按 dynamic 处理，导出时报错。
export const dynamic = 'force-static' as const;
export const revalidate = 0;

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const postEntries = posts.map((post) => ({
    url: `${baseUrl}/posts/${post.slug}/`,
    lastModified: post.date,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
    {
      url: `${baseUrl}/archive/`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tags/`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about/`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/links/`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [...staticPages, ...postEntries];
}
