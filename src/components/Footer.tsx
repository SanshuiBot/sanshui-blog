import Link from 'next/link';
import { Code2, Mail, Rss } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{ viewTransitionName: 'site-footer' }}
      className="border-t border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-950/50"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <Link href="/" className="text-xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
              三水
            </Link>
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-500 leading-relaxed max-w-xs">
              记录技术思考、生活感悟与创作灵感. 用文字沉淀知识，用代码改变世界.
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
                <a
                  href="https://github.com/SanshuiBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-200"
                >
                  <Code2 size={14} />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="mailto:localhost6@foxmail.com"
                  className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-200"
                >
                  <Mail size={14} />
                  Email
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
          <p className="text-xs text-stone-400 dark:text-stone-600 flex items-center gap-1">
            Built with Next.js &middot; MDX &middot; Tailwind CSS
            <Rss size={12} className="opacity-40" />
          </p>
        </div>
      </div>
    </footer>
  );
}