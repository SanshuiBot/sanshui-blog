'use client';

import { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransitionContextType {
  pageKey: string;
  setPageKey: (key: string) => void;
  isTransitioning: boolean;
  setIsTransitioning: (transitioning: boolean) => void;
}

const TransitionContext = createContext<TransitionContextType>({
  pageKey: 'initial',
  setPageKey: () => {},
  isTransitioning: false,
  setIsTransitioning: () => {}
});

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [pageKey, setPageKey] = useState('initial');
  const [isTransitioning, setIsTransitioning] = useState(false);

  return (
    <TransitionContext.Provider value={{ pageKey, setPageKey, isTransitioning, setIsTransitioning }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pageKey}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 25,
              duration: 0.6
            }
          }}
          exit={{
            opacity: 0,
            x: -20,
            scale: 0.95,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 25,
              duration: 0.6
            }
          }}
          className="fixed inset-0 z-[99999]"
          style={{
            pointerEvents: 'none',
            transformOrigin: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-violet-500/10 to-cyan-500/10 dark:from-pink-500/20 dark:via-violet-500/20 dark:to-cyan-500/20" />
        </motion.div>
      </AnimatePresence>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
}

// Hook for smooth navigation
export function useNavigate() {
  const { setPageKey, isTransitioning, setIsTransitioning } = useTransition();

  const navigate = (path: string) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setPageKey(path + Date.now().toString());

    // Use experimental navigation API if available
    if ('navigation' in window) {
      (window as any).navigation.navigate(path)
        .then(() => {
          setIsTransitioning(false);
        })
        .catch(() => {
          // Fallback to regular navigation
          window.location.href = path;
        });
    } else {
      // Fallback to regular navigation
      window.location.href = path;
    }
  };

  return { navigate, isTransitioning };
}

// Navigation button component
export function NavigationButton({
  href,
  children,
  className = '',
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const { navigate, isTransitioning } = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 pointer-events-none' : ''} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}