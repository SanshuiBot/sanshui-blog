"use client";
import { motion } from "framer-motion";
import { FileText, Globe, Lightbulb, User } from "lucide-react";

const stats = [
  { value: "10+", label: "\u6587\u7ae0", icon: FileText, color: "from-accent-pink/20 to-accent-rose/10", dot: "bg-accent-pink" },
  { value: "24/7", label: "\u5728\u7ebf", icon: Globe, color: "from-accent-violet/20 to-accent-blue/10", dot: "bg-accent-violet" },
  { value: "\u221e", label: "\u60f3\u6cd5", icon: Lightbulb, color: "from-accent-blue/20 to-accent-teal/10", dot: "bg-accent-blue" },
  { value: "1", label: "\u4f5c\u8005", icon: User, color: "from-accent-gold/20 to-accent-rose/10", dot: "bg-accent-gold" },
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
            whileHover={{ y: -5, transition: { type: "spring", stiffness: 200, damping: 15 } }}
            className="group relative p-5 rounded-2xl glass border-white/5 overflow-hidden"
          >
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${s.color}`}
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 18 }}
            />
            <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${s.dot} opacity-40`} />
            <div className="relative">
              <s.icon size={20} className="text-gray-500 mb-3" />
              <div className="text-2xl font-bold text-white mb-1 tracking-tight">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
