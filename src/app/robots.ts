import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';

// 站点 URL 唯一来源 siteConfig.url（双端部署自动跟随，见 sitemap.ts 注释）
const baseUrl = siteConfig.url;

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
