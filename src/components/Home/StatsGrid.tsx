'use client';
import { motion } from 'framer-motion';

const stats = [
  { value: '10+', label: '文章' },
  { value: '24/7', label: '在线' },
  { value: '∞', label: '想法' },
  { value: '1', label: '作者' },
];

export default function StatsGrid() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4 }}
            className="group relative p-5 rounded-2xl glass border-white/5 transition-all duration-500 hover:border-white/10 hover:glow-pink"
          >
            <div className="text-2xl font-bold text-white mb-1 tracking-tight">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
