'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ListTree } from 'lucide-react';

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

  const headings = useMemo<TOCItem[]>(() => {
    const regex = /^(#{1,4})\s+(.+)$/gm;
    const items: TOCItem[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, '-')
        .replace(/(^-|-$)/g, '');
      items.push({ id, text, level });
    }
    return items;
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 rounded-full bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 shadow-lg hover:shadow-xl transition-shadow"
        aria-label="目录"
      >
        <ListTree size={20} />
      </button>

      {/* Desktop sidebar */}
      <nav className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-4 flex items-center gap-2">
          <ListTree size={16} />
          目录
        </h3>
        <ul className="space-y-1.5 text-sm border-l-2 border-stone-200 dark:border-stone-800">
          {headings.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="block text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors py-0.5"
                style={{ paddingLeft: `${(item.level - 1) * 16 + 12}px` }}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile drawer */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden fixed bottom-24 right-6 z-50 w-72 max-h-96 overflow-y-auto rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl p-5"
        >
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3 flex items-center gap-2">
            <ListTree size={16} />
            目录
          </h3>
          <ul className="space-y-1.5 text-sm">
            {headings.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setIsOpen(false)}
                  className="block text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors py-0.5"
                  style={{ paddingLeft: `${(item.level - 1) * 16 + 8}px` }}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </>
  );
}