import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/sanshui-blog',
  assetPrefix: '/sanshui-blog',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
