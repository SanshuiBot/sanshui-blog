import { type MetadataRoute } from 'next';

const baseUrl = 'https://sanshuibot.github.io/sanshui-blog';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
