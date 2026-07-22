"use client";
import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/toc";

interface Props {
  items: TocItem[];
}

export default function TableOfContents({ items }: Props) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="hidden lg:block sticky top-28 w-56 shrink-0 self-start ml-8" aria-label="目录">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">目录</h4>
      <ul className="space-y-0.5 border-l border-white/10 pl-3">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.id);
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className={`block py-1 text-sm transition-colors duration-200 truncate ${
                item.level === 2 ? "pl-0" : "pl-3"
              } ${
                activeId === item.id
                  ? "text-accent-violet font-medium"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
