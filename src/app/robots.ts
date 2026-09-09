import type { MetadataRoute } from 'next';
import { BASE_PATH } from '@/lib/basePath';

const baseUrl = 'https://sanshuibot.github.io' + BASE_PATH;

// 配合 output: 'export' 静态导出：显式声明 force-static
export const dynamic = 'force-static' as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
