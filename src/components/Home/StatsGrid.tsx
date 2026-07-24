"use client";
import { motion, useMotionValue, animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import { FileText, Globe, Lightbulb, User } from "lucide-react";

/* ── Data ─────────────────────────────────────────── */

const stats = [
  {
    num: 10, suffix: "+", label: "文章", icon: FileText,
    gradient: "from-accent-pink to-accent-rose",
    iconColor: "text-accent-pink",
    bgAccent: "bg-accent-pink/[0.04]",
    glow: "rgba(255,110,199,0.15)",
    blobPos: "top-[-30%] right-[-20%]",
    edgePos: "left-0",
    iconHover: { rotate: -6, scale: 1.15 },
    desc: "持续输出技术干货",
    dir: { x: -16 },
  },
  {
    num: 24, suffix: "/7", label: "在线", icon: Globe,
    gradient: "from-accent-violet to-accent-blue",
    iconColor: "text-accent-violet",
    bgAccent: "bg-accent-violet/[0.04]",
    glow: "rgba(168,85,247,0.15)",
    blobPos: "bottom-[-30%] left-[-20%]",
    edgePos: "left-0",
    iconHover: { rotate: 20 },
    desc: "全天候创作与维护",
    dir: { x: 16 },
  },
  {
    display: "∞", label: "想法", icon: Lightbulb,
    gradient: "from-accent-blue to-accent-teal",
    iconColor: "text-accent-blue",
    bgAccent: "bg-accent-blue/[0.04]",
    glow: "rgba(56,189,248,0.15)",
    blobPos: "top-[-20%] left-[-30%]",
    edgePos: "left-0",
    iconHover: { scale: 1.25 },
    desc: "灵感永不枯竭",
    dir: { x: -16 },
  },
  {
    num: 1, suffix: "", label: "作者", icon: User,
    gradient: "from-accent-gold to-accent-rose",
    iconColor: "text-accent-gold",
    bgAccent: "bg-accent-gold/[0.04]",
    glow: "rgba(251,191,36,0.15)",
    blobPos: "bottom-[-20%] right-[-30%]",
    edgePos: "left-0",
    iconHover: { y: -4 },
    desc: "一个人就是一支队伍",
    dir: { x: 16 },
  },
];

/* ── Animated Counter ─────────────────────────────── */

function AnimatedValue({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useMotionValue(0);

  useEffect(() => {
    if (!isInView) return;
    count.set(0);
    const controls = animate(count, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => rounded.set(Math.round(v)),
    });
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = `${v}${suffix}`;
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [isInView, value, suffix, count, rounded]);

  return <span ref={ref}>0</span>;
}

/* ── Component ────────────────────────────────────── */

export default function StatsGrid() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, ...s.dir }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 200, damping: 14 } }}
            className="group relative p-5 rounded-2xl glass border-white/5 shadow-soft-hover overflow-hidden cursor-default"
          >
            {/* Permanent tinted background */}
            <div className={`absolute inset-0 ${s.bgAccent} rounded-2xl`} />

            {/* Decorative glow blob */}
            <div
              className={`absolute ${s.blobPos} w-[120px] h-[120px] rounded-full blur-[60px] transition-all duration-700 group-hover:scale-[2.5] group-hover:opacity-80`}
              style={{ background: s.glow }}
            />

            {/* Permanent left accent bar */}
            <div
              className={`absolute ${s.edgePos} top-3 bottom-3 w-[2.5px] rounded-r-full bg-gradient-to-b ${s.gradient} opacity-40 group-hover:opacity-100 transition-opacity duration-300`}
            />

            <div className="relative pl-3">
              {/* Icon */}
              <motion.div
                className={`${s.iconColor} mb-2.5 transition-colors duration-300`}
                whileHover={s.iconHover}
                transition={{ type: "spring", stiffness: 280, damping: 10 }}
              >
                <s.icon size={18} />
              </motion.div>

              {/* Value */}
              <div
                className={`text-2xl font-bold mb-0.5 tracking-tight bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}
              >
                {"display" in s ? s.display : <AnimatedValue value={s.num!} suffix={s.suffix} />}
              </div>

              {/* Label + desc inline */}
              <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
              <p className="text-[10px] text-gray-600/40 mt-1 leading-relaxed line-clamp-1 transition-colors duration-300 group-hover:text-gray-500/70">
                {s.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
