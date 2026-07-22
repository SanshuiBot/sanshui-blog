'use client';
import { ThemeProvider } from 'next-themes';
import { TransitionProvider } from '@/lib/transition';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Post } from '@/lib/types';
export default function Provider({ children, posts }: { children: React.ReactNode; posts: Post[] }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="t">
      <TransitionProvider>
        <Header posts={posts} />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
      </TransitionProvider>
    </ThemeProvider>
  );
}
