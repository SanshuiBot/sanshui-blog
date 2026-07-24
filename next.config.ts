import type { NextConfig } from 'next';

const securityHeaders = [
  // HTTPS enforcement (1 year + preload)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Mitigate XSS / data injection
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Disallow framing (clickjacking protection)
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Restrict powerful browser APIs to same origin
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
];

const nextConfig: NextConfig = {
  // `output: `"'export`"' / basePath / assetPrefix are ONLY enabled at build time.
  // In dev they break HMR (hot reload hangs / server crashes on every edit).
  // for dynamic routes with non-ASCII (Chinese) slugs.
  ...(process.env.NEXT_BUILD === '1' ? { output: 'export' as const, basePath: '/sanshui-blog', assetPrefix: '/sanshui-blog' } : {}),
  // Remove `X-Powered-By: Next.js` header for security through obscurity.
  poweredByHeader: false,
  // React strict mode surfaces more bugs in dev.
  reactStrictMode: true,
  images: {
    unoptimized: true, // static export â€?no server optimizer
    formats: ['image/avif', 'image/webp'],
  },
  trailingSlash: true,
  experimental: {
    // Enable browser View Transitions API for instant cross-fade
    // navigation between routes.
    viewTransition: false,
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Long-cache immutable static assets (_next/static/*)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
