'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevRef = useRef(pathname);
  const [tx, setTx] = useState(false);

  useEffect(() => {
    if (prevRef.current !== pathname) { setTx(true); setTimeout(() => setTx(false), 300); prevRef.current = pathname; }
  }, [pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        {tx && (
          <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/10 to-cyan-500/10 dark:from-fuchsia-500/15 dark:via-violet-500/15 dark:to-cyan-500/15" />
            <motion.div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,#e879f9,#818cf8,#22d3ee,transparent)', backgroundSize: '200% 100%' }} animate={{ backgroundPosition: ['0%','200%'] }} transition={{ duration: 0.6, ease: 'linear' }} />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
