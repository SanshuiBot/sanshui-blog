import { type MetadataRoute } from 'next';

const baseUrl = 'https://sanshuibot.github.io/sanshui-blog';

// Required for `output: export` — ensures robots.txt is statically generated.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // No disallowed paths — fully public blog.
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
