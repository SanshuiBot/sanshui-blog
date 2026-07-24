'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

const tagGradients = [
  'from-accent-pink/20 to-accent-rose/20',
  'from-accent-violet/20 to-accent-pink/20',
  'from-accent-blue/20 to-accent-teal/20',
  'from-accent-teal/20 to-accent-blue/20',
  'from-accent-gold/20 to-accent-rose/20',
];

export default function PostCard({ post, index }: { post: any; index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse-following spotlight
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 100, damping: 20 });
  const sy = useSpring(my, { stiffness: 100, damping: 20 });
  const spotlight = useTransform(
    [sx, sy],
    ([x, y]) => `radial-gradient(280px circle at ${x}% ${y}%, rgba(168,85,247,0.22), rgba(255,110,199,0.12) 30%, transparent 60%)`,
  );

  // 3D tilt values
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 15 });
  const sry = useSpring(ry, { stiffness: 120, damping: 15 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mx.set(px * 100);
    my.set(py * 100);
    ry.set((px - 0.5) * 5);
    rx.set(-(py - 0.5) * 5);
  };
  const onLeave = () => {
    mx.set(50);
    my.set(50);
    rx.set(0);
    ry.set(0);
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="group relative h-full"
        style={{ perspective: '800px' }}
      >
        {/* Spotlight */}
        <motion.div
          aria-hidden
          className="absolute -inset-px rounded-2xl pointer-events-none"
          style={{ background: spotlight, opacity: 0 }}
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
        />

        {/* Card wrapper with spring hover */}
        <motion.div
          whileHover={{ y: -8, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14, mass: 0.8 }}
          style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}
          className="p-[1px] rounded-2xl bg-white/5 h-full shadow-neon-hover"
        >
          {/* Border glow */}
          <motion.div
            aria-hidden
            className="absolute -inset-[1px] rounded-2xl pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,110,199,0.4), rgba(168,85,247,0.3), rgba(56,189,248,0.2))',
              opacity: 0,
            }}
            whileHover={{ opacity: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 18 }}
          />

          <article
            className="relative flex flex-col h-full bg-surface rounded-2xl overflow-hidden"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Animated top accent line */}
            <motion.div
              className="h-[2px] bg-gradient-to-r from-accent-pink via-accent-violet to-accent-blue"
              initial={{ scaleX: 0, opacity: 0 }}
              whileHover={{ scaleX: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 16 }}
              style={{ transformOrigin: 'left' }}
            />

            <div className="flex-1 p-5 sm:p-6 flex flex-col">
              {/* Tags — standalone links */}
              <motion.div
                className="flex flex-wrap gap-1.5 mb-3 min-h-[1.375rem]"
                whileHover="hovered"
                initial="idle"
              >
                {(post.tags ?? []).slice(0, 3).map((t: string, i: number) => (
                  <motion.div
                    key={t}
                    variants={{
                      idle: { y: 0, opacity: 1 },
                      hovered: { y: -2, opacity: 1 },
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: i * 0.03 }}
                  >
                    <Link
                      href={`/tags/${encodeURIComponent(t)}`}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${tagGradients[i % tagGradients.length]} text-gray-400 hover:text-white transition-colors`}
                    >
                      <Tag size={9} />
                      {t}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Everything below is ONE link to the post — no ambiguity */}
              <Link
                href={`/posts/${post.slug}`}
                prefetch={true}
                className="flex-1 flex flex-col group/link"
              >
                {/* Title */}
                <motion.h2
                  className="text-lg font-bold text-white mb-2 line-clamp-2 overflow-hidden min-h-[2.75rem] tracking-tight leading-snug shrink-0"
                  whileHover={{ color: '#a855f7', x: 2 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {post.title}
                </motion.h2>

                {/* Excerpt */}
                <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-2 flex-1 min-h-0">{post.excerpt}</p>

                {/* Footer with "阅读" as part of the link */}
                <motion.div
                  className="flex items-center justify-between pt-3 border-t border-white/5"
                  whileHover="hovered"
                  initial="idle"
                >
                  <span className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Clock size={11} />
                    {fmt(post.date)}
                  </span>
                  <motion.span
                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 group-hover/link:text-accent-violet transition-colors"
                    variants={{
                      idle: { x: 0 },
                      hovered: { x: 3 },
                    }}
                    transition={{ type: 'spring', stiffness: 180, damping: 15 }}
                  >
                    阅读
                    <motion.span
                      variants={{
                        idle: { x: 0, y: 0 },
                        hovered: { x: 2, y: -2 },
                      }}
                      transition={{ type: 'spring', stiffness: 250, damping: 14 }}
                    >
                      <ArrowUpRight size={12} />
                    </motion.span>
                  </motion.span>
                </motion.div>
              </Link>
            </div>
          </article>
        </motion.div>
      </div>
    </motion.div>
  );
}
