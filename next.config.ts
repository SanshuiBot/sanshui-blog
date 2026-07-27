import type { NextConfig } from 'next';

/**
 * 静态导出（output: 'export'）下的安全头与缓存策略
 * 通过 public/_headers 文件配置（Next 静态导出会原样复制到 out/）。
 * 原因：output: 'export' 模式下，next.config.ts 的 headers() 不会生效，
 * 因为静态 HTML 文件由托管平台（GitHub Pages）直接返回，不经过 Next。
 */

const nextConfig: NextConfig = {
  // `output: 'export'` / basePath / assetPrefix 仅在构建时启用。
  // dev 模式下不设置 NEXT_BUILD，避免 HMR 失败。
  ...(process.env.NEXT_BUILD === '1'
    ? { output: 'export' as const, basePath: '/sanshui-blog', assetPrefix: '/sanshui-blog' }
    : {}),
  // 移除 X-Powered-By: Next.js 头（安全通过模糊化）。
  poweredByHeader: false,
  // React 严格模式在开发中暴露更多 bug。
  reactStrictMode: true,
  images: {
    unoptimized: true, // 静态导出 — 无服务端优化器
    formats: ['image/avif', 'image/webp'],
  },
  trailingSlash: true,
  // optimizePackageImports: 让 framer-motion、lucide-react 等大库按需引入，
  // 减少首屏 JS 体积。Next 15 内置的 chunk 策略已经合理，不再自定义 splitChunks
  // （自定义会与 SWC 内置策略冲突，反而拆出更多碎 chunk）。
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', 'react-icons'],
  },
};

export default nextConfig;
