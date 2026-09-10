import { networkInterfaces } from 'node:os';
import type { NextConfig } from 'next';

/**
 * 静态导出（output: 'export'）下的安全头与缓存策略
 * 通过 public/_headers 文件配置（Next 静态导出会原样复制到 out/）。
 * 原因：output: 'export' 模式下，next.config.ts 的 headers() 不会生效，
 * 因为静态 HTML 文件由托管平台（GitHub Pages）直接返回，不经过 Next。
 */

// dev 模式 HMR 白名单（Next 15.2+ allowedDevOrigins 防 DNS rebinding，仅 dev 生效）：
// 启动时自动收集本机所有 IPv4 + localhost，克隆后零配置即可用任意本机 IP 访问
// dev server，DHCP 换 IP 也无需改代码（每次启动重新探测）。
function collectDevOrigins(): string[] {
  const origins = new Set<string>(['localhost']);
  for (const infos of Object.values(networkInterfaces())) {
    for (const info of infos ?? []) {
      if (info.family === 'IPv4' && !info.internal) origins.add(info.address);
    }
  }
  return [...origins];
}

const isBuild = process.env.NEXT_BUILD === '1';
// 双端部署 basePath 双态（AGENTS.md 约定 #1 的扩展）：
//  - GitHub Pages 端：默认 /sanshui-blog（子路径部署）
//  - Cloudflare Pages 端：不支持子路径，必须根路径部署 → 构建时设环境变量
//    SITE_BASE_PATH='/'（CF 面板不允许空字符串值，用 '/' 标记根路径；
//    空字符串 '' 同样兼容），产物资源链接不再带 /sanshui-blog 前缀
const envBasePath = process.env.SITE_BASE_PATH;
const BASE_PATH =
  envBasePath === '' || envBasePath === '/'
    ? ''
    : (envBasePath ?? (isBuild ? '/sanshui-blog' : ''));

const nextConfig: NextConfig = {
  // `output: 'export'` / basePath / assetPrefix 仅在构建时启用。
  // dev 模式下不设置 NEXT_BUILD，避免 HMR 失败。
  // basePath 为 '' 时（CF 端）仍保持 output: 'export'，只是不带前缀。
  ...(isBuild
    ? {
        output: 'export' as const,
        ...(BASE_PATH ? { basePath: BASE_PATH, assetPrefix: BASE_PATH } : {}),
      }
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
    // formats 在 unoptimized 模式下不生效（Next.js 优化器被跳过），省略避免误导
  },
  // 局域网 IP 访问 dev server 的白名单：自动探测本机 IPv4（见 collectDevOrigins），
  // 不在列表的来源会被拒，表现为 HMR WebSocket failed + 全屏错误 overlay。
  allowedDevOrigins: collectDevOrigins(),
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
