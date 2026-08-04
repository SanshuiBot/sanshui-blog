import type { NextConfig } from 'next';

/**
 * 静态导出（output: 'export'）下的安全头与缓存策略
 * 通过 public/_headers 文件配置（Next 静态导出会原样复制到 out/）。
 * 原因：output: 'export' 模式下，next.config.ts 的 headers() 不会生效，
 * 因为静态 HTML 文件由托管平台（GitHub Pages）直接返回，不经过 Next。
 */

const isBuild = process.env.NEXT_BUILD === '1';
const BASE_PATH = isBuild ? '/sanshui-blog' : '';

const nextConfig: NextConfig = {
  // `output: 'export'` / basePath / assetPrefix 仅在构建时启用。
  // dev 模式下不设置 NEXT_BUILD，避免 HMR 失败。
  ...(isBuild
    ? { output: 'export' as const, basePath: '/sanshui-blog', assetPrefix: '/sanshui-blog' }
    : {}),
  // 把 basePath 通过 NEXT_PUBLIC_ 变量 inline 到客户端 bundle，
  // 让 src/lib/basePath.ts 在 SSR 和客户端 hydration 时拿到一致的值。
  // 否则客户端读不到 process.env.NEXT_BUILD，withBase() 退化为无前缀路径 → 线上 404。
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
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
  // 减少首屏 JS 体积。Next 16 仍保留在 experimental 下（顶层不存在该键）。
  // Next 内置的 chunk 策略已经合理，不再自定义 splitChunks
  // （自定义会与内置策略冲突，反而拆出更多碎 chunk）。
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
};

export default nextConfig;
