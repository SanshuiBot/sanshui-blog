import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-950/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <Link href="/" className="text-xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
              三水
            </Link>
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-500 leading-relaxed max-w-xs">
              记录技术思考、生活感悟与创作灵感。用文字沉淀知识，用代码改变世界。
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-50 uppercase tracking-widest mb-4">
              导航
            </h3>
            <ul className="space-y-3">
              {[
                { href: '/', label: '首页' },
                { href: '/archive', label: '归档' },
                { href: '/tags', label: '标签' },
                { href: '/about', label: '关于' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-50 uppercase tracking-widest mb-4">
              更多
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/links" className="text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-200">
                  友情链接
                </Link>
              </li>
              <li>
                <Link href="/feed.xml" className="text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-200">
                  RSS Feed
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/SanshuiBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-200"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-stone-200/50 dark:border-stone-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-400 dark:text-stone-600">
            &copy; {currentYear} 三水. All rights reserved.
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-600">
            Built with Next.js &middot; Tailwind CSS &middot; Motion
          </p>
        </div>
      </div>
    </footer>
  );
}