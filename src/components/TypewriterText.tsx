'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface TypewriterTextProps {
  /** Words to cycle through */
  words: string[];
  className?: string;
  /** Typing speed per char (ms) */
  typeSpeed?: number;
  /** Delete speed per char (ms) */
  deleteSpeed?: number;
  /** Pause at full word (ms) */
  pauseDuration?: number;
}

/**
 * Typewriter effect — types/deletes words in a loop.
 *
 * Performance:
 *   - Uses `requestAnimationFrame` + timestamp deltas (no setInterval drift).
 *   - Starts only when scrolled into view (`useInView`).
 *   - Cleans up animation frame on unmount.
 *
 * Inspired by: Arfazrll/PersonalBlog typewriter hero + IsHereZahin
 * rotating role text.
 */
export default function TypewriterText({
  words,
  className = '',
  typeSpeed = 80,
  deleteSpeed = 40,
  pauseDuration = 1800,
}: TypewriterTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });

  const [displayed, setDisplayed] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isInView || words.length === 0) return;

    const word = words[wordIndex % words.length] ?? '';
    let rafId = 0;
    let lastTime = performance.now();
    let nextDelay = isDeleting ? deleteSpeed : typeSpeed;

    const tick = (now: number) => {
      const delta = now - lastTime;
      if (delta >= nextDelay) {
        lastTime = now;
        if (isDeleting) {
          const next = word.slice(0, Math.max(0, displayed.length - 1));
          setDisplayed(next);
          if (next.length === 0) {
            setIsDeleting(false);
            setWordIndex((i) => (i + 1) % words.length);
            nextDelay = typeSpeed * 2; // small pause before typing next
          } else {
            nextDelay = deleteSpeed;
          }
        } else {
          const next = word.slice(0, Math.min(word.length, displayed.length + 1));
          setDisplayed(next);
          if (next.length === word.length) {
            // schedule delete after pause
            nextDelay = pauseDuration;
            // flip to deleting on the following tick
            setTimeout(() => setIsDeleting(true), pauseDuration);
          } else {
            nextDelay = typeSpeed;
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [displayed, isDeleting, wordIndex, words, isInView, typeSpeed, deleteSpeed, pauseDuration]);

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      aria-label={words[wordIndex % words.length] ?? ''}
    >
      {displayed}
      <span
        className="inline-block w-[2px] h-[1em] align-[-0.1em] ml-0.5 bg-current animate-pulse"
        aria-hidden="true"
      />
    </motion.span>
  );
}
