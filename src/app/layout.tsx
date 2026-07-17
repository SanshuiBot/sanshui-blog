import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeToggle';
import Layout from '@/components/Layout';
import { BlogSiteJsonLd } from '@/components/JsonLd';
import { getAllPosts } from '@/lib/posts';

export const metadata: Metadata = {
  title: {
    default: '三水 | 个人博客',
    template: '%s | 三水',
  },
  description: '记录技术思考、生活感悟与创作灵感',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: '三水 | 个人博客',
    description: '记录技术思考、生活感悟与创作灵感',
    type: 'website',
    locale: 'zh_CN',
    siteName: '三水博客',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const posts = getAllPosts();

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* Critical: prevent flash of wrong theme */}
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
      <body className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 antialiased">
        <ThemeProvider>
          <Layout posts={posts}>{children}</Layout>
          <BlogSiteJsonLd />
        </ThemeProvider>
      </body>
    </html>
  );
}