'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 250);
      prevPathRef.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        {isTransitioning && (
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <div className="absolute inset-0 bg-linear-to-br from-pink-500/8 via-violet-500/8 to-cyan-500/8 dark:from-pink-500/12 dark:via-violet-500/12 dark:to-cyan-500/12" />
            <motion.div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, #f472b6, #c084fc, #60a5fa, #34d399, transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
              transition={{ duration: 0.5, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
