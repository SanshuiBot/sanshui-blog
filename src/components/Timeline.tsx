'use client';

import { motion } from 'framer-motion';

interface TimelineEvent { year: string; title: string; description: string; }
interface TimelineProps { events: TimelineEvent[] }

export default function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-pink-500 via-violet-500 to-cyan-500" />
      {events.map((event, i) => (
        <motion.div key={event.year} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative pl-12 pb-10 last:pb-0"
        >
          <div className="absolute left-[0.5rem] top-1 w-[7px] h-[7px] rounded-full bg-gradient-to-r from-pink-500 to-violet-500 shadow-lg shadow-pink-500/30 animate-pulse-soft" />
          <span className="text-xs font-mono text-violet-500 dark:text-violet-400 font-semibold tracking-wider">{event.year}</span>
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50 mt-1">{event.title}</h3>
          <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">{event.description}</p>
        </motion.div>
      ))}
    </div>
  );
}
