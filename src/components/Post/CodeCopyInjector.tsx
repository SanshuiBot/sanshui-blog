'use client';
import { useEffect } from 'react';

/**
 * Injects "复制" (copy) buttons into <pre> blocks rendered by MDX.
 * Uses a MutationObserver to catch dynamically-added content.
 * Extracted as a standalone component so it has a single responsibility.
 */
export default function CodeCopyInjector() {
  useEffect(() => {
    const inject = () => {
      document.querySelectorAll<HTMLPreElement>('article pre:not([data-ci])').forEach((pre, i) => {
        pre.setAttribute('data-ci', 'true');
        pre.setAttribute('data-cid', `c${i}`);

        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', '复制');
        b.className =
          'absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-all bg-black/85 text-[#d4d4d4] border border-gray-600/40 shadow-lg shadow-black/50 backdrop-blur-sm hover:bg-accent-violet/20 hover:text-accent-violet hover:border-accent-violet/30';
        b.textContent = '复制';
        b.onclick = async () => {
          const c = pre.querySelector('code');
          if (!c) return;
          try {
            await navigator.clipboard.writeText(c.textContent ?? '');
            b.textContent = '已复制!';
            setTimeout(() => {
              b.textContent = '复制';
            }, 2000);
          } catch {
            // Clipboard API not available
          }
        };
        pre.classList.add('group', 'relative');
        pre.appendChild(b);
      });
    };

    // Initial injection after mount
    const timer = setTimeout(inject, 100);

    // Observe dynamically added <pre> elements (e.g. MDX lazy rendering)
    const observer = new MutationObserver(inject);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
