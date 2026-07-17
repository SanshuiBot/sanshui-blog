import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-500">
            <span className="font-semibold text-stone-700 dark:text-stone-300">三水</span>
            <span>·</span>
            <span>© {currentYear}</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-stone-500 dark:text-stone-500">
            <Link href="/" className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
              首页
            </Link>
            <Link href="/about" className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
              关于
            </Link>
            <Link href="/rss.xml" className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
              RSS
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-stone-100 dark:border-stone-900 text-center">
          <p className="text-xs text-stone-400 dark:text-stone-600">
            Built with Next.js 15 · Tailwind CSS · Framer Motion
          </p>
        </div>
      </div>
    </footer>
  );
}
