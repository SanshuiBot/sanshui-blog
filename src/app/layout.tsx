import type { Metadata, Viewport } from 'next';
import './globals.css';
import { sans, mono, serif } from './fonts';
import { ThemeProvider } from '@/components/ThemeToggle';
import Layout from '@/components/Layout';
import { BlogSiteJsonLd } from '@/components/JsonLd';
import MeshGradient from '@/components/MeshGradient';
import ParticleBackgroundWrapper from '@/components/ParticleBackgroundWrapper';
import StarField from '@/components/StarField';
import AmbientOrbs from '@/components/AmbientOrbs';
import GridDistortion from '@/components/GridDistortion';
import MouseCursor from '@/components/MouseCursor';
import { TransitionProvider } from '@/lib/transition';
import { getAllPosts } from '@/lib/posts';

const baseUrl = 'https://sanshuibot.github.io/sanshui-blog';
const siteName = '三水 | 个人博客';
const description = '记录技术思考、生活感悟与创作灵感. 用文字沉淀知识，用代码改变世界.';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteName,
    template: '%s | 三水',
  },
  description,
  applicationName: siteName,
  generator: 'Next.js',
  keywords: [
    '三水', '个人博客', '技术博客', '前端开发',
    'Next.js', 'React', 'TypeScript', 'MDX',
  ],
  authors: [{ name: '三水', url: `${baseUrl}/about` }],
  creator: '三水',
  publisher: '三水',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
  manifest: '/sanshui-blog/manifest.webmanifest',
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': `${baseUrl}/rss.xml`,
    },
  },
  openGraph: {
    title: siteName,
    description,
    type: 'website',
    locale: 'zh_CN',
    url: baseUrl,
    siteName: '三水博客',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '三水 | 个人博客' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description,
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
  formatDetection: { email: false, address: false, telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const posts = getAllPosts();

  return (
    <html
      lang="zh-CN"
      dir="ltr"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} ${serif.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('blog-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-[100dvh] flex flex-col bg-stone-50 dark:bg-[#050505] antialiased">
        <a href="#main-content" className="skip-link">
          跳转到主要内容
        </a>
        <ThemeProvider>
          <TransitionProvider>
            {/* Background layers (z-order: mesh → grid → orbs → stars → particles) */}
            <MeshGradient />
            <GridDistortion />
            <AmbientOrbs />
            <StarField />
            <ParticleBackgroundWrapper />
            <MouseCursor />
            {/* Noise overlay — single fixed element, GPU-friendly */}
            <div className="noise-overlay" aria-hidden="true" />
            <Layout posts={posts}>{children}</Layout>
            <BlogSiteJsonLd />
          </TransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
