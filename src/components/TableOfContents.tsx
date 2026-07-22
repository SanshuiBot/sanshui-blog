'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ListTree } from 'lucide-react';

interface TOCItem { id: string; text: string; level: number; }

interface TableOfContentsProps { content: string; }

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState('');

  const headings = useMemo(() => {
    const items: TOCItem[] = [];
    const regex = /^(#{1,4})\s+(.+)$/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const level = match[1]?.length ?? 1;
      const text = (match[2] ?? '').trim();
      const id = text.toLowerCase().replace(/[^\w一-鿿]+/g, '-').replace(/(^-|-$)/g, '');
      items.push({ id, text, level });
    }
    return items;
  }, [content]);

  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    headings.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) { window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); setActiveId(id); }
  };

  if (!headings.length) return null;

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-50 mb-4 flex items-center gap-2 uppercase tracking-widest"><ListTree size={14} />目录</h3>
      <ul className="space-y-0 text-sm border-l-2 border-stone-200 dark:border-stone-800">
        {headings.map((item) => (
          <li key={item.id} className="relative">
            <a href={`#${item.id}`} onClick={(e) => handleClick(e, item.id)}
              className={`block py-1.5 transition-all duration-300 ease-[var(--ease-out-quint)] ${activeId === item.id ? 'text-red-600 dark:text-red-400 font-medium' : 'text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'}`}
              style={{ paddingLeft: `${(item.level - 1) * 14 + 14}px` }}
            >{item.text}</a>
            {activeId === item.id && <motion.span layoutId="toc-active" className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-gradient-to-b from-red-600 to-orange-500 rounded-full" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />}
          </li>
        ))}
      </ul>
    </nav>
  );
}
