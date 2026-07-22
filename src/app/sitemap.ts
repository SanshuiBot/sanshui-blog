import { getAllPosts } from '@/lib/posts';
import { type MetadataRoute } from 'next';

export const dynamic = 'force-static';
const baseUrl = 'https://sanshuibot.github.io/sanshui-blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/archive`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/tags`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${baseUrl}/links`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
    ...posts.map((post) => ({ url: `${baseUrl}/posts/${post.slug}`, lastModified: new Date(post.date), changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
