import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

/** 布局壳：Navbar + main 内容区 + Footer。与 Providers / AmbientEffects 层级分离。 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 无障碍 skip-link：键盘/读屏用户一键跳过导航直达正文。
          纯锚点片段（#main），无路径变化，无需 withBase。 */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-stone-900 focus:shadow-lg"
      >
        跳到正文
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
