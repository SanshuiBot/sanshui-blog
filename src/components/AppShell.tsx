'use client';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

/** 布局壳：Navbar + main 内容区 + Footer。与 Providers / AmbientEffects 层级分离。 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
