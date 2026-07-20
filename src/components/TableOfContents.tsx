'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ListTree, X } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  const headings = useMemo<TOCItem[]>(() => {
    const regex = /^(#{1,4})\s+(.+)$/gm;
    const items: TOCItem[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const level = match[1]?.length ?? 1;
      const text = (match[2] ?? '').trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, '-')
        .replace(/(^-|-$)/g, '');
      items.push({ id, text, level });
    }
    return items;
  }, [content]);

  // Scroll-spy: highlight the heading currently in view
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost intersecting heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      },
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
        setActiveId(id);
        setIsOpen(false);
      }
    },
    [],
  );

  if (headings.length === 0) return null;

  const renderItem = (item: TOCItem) => {
    const isActive = activeId === item.id;
    return (
      <li key={item.id} className="relative">
        <a
          href={`#${item.id}`}
          onClick={(e) => handleClick(e, item.id)}
          className={`block py-1.5 transition-all duration-300 ease-[var(--ease-out-quint)] ${
            isActive
              ? 'text-red-600 dark:text-red-400 font-medium'
              : 'text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
          style={{ paddingLeft: `${(item.level - 1) * 14 + 14}px` }}
        >
          {item.text}
        </a>
        {/* Active indicator bar */}
        {isActive && (
          <motion.span
            layoutId="toc-active"
            className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-gradient-to-b from-red-600 to-orange-500 rounded-full"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
          />
        )}
      </li>
    );
  };

  return (
    <>
      {/* Mobile floating toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-[var(--z-sticky)] p-3 rounded-full bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
        aria-label="目录"
      >
        {isOpen ? <X size={20} /> : <ListTree size={20} />}
      </button>

      {/* Desktop sidebar */}
      <nav className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-50 mb-4 flex items-center gap-2 uppercase tracking-widest">
          <ListTree size={14} />
          目录
        </h3>
        <ul className="space-y-0 text-sm border-l-2 border-stone-200 dark:border-stone-800">
          {headings.map(renderItem)}
        </ul>
      </nav>

      {/* Mobile drawer */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="lg:hidden fixed bottom-24 right-6 z-[var(--z-sticky)] w-72 max-h-96 overflow-y-auto rounded-2xl glass-strong shadow-xl p-5"
        >
          <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-50 mb-3 flex items-center gap-2 uppercase tracking-widest">
            <ListTree size={14} />
            目录
          </h3>
          <ul className="space-y-0 text-sm">
            {headings.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleClick(e, item.id)}
                    className={`block py-1.5 transition-colors ${
                      isActive
                        ? 'text-red-600 dark:text-red-400 font-medium'
                        : 'text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                    style={{ paddingLeft: `${(item.level - 1) * 14 + 8}px` }}
                  >
                    {item.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </>
  );
}
