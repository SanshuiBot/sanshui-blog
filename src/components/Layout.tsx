import type { Post } from '@/lib/types';
import Footer from './Footer';
import Header from './Header';

interface LayoutProps { children: React.ReactNode; posts: Post[] }

export default function Layout({ children, posts }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-[#050505]">
      <Header posts={posts} />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
