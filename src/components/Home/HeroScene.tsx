'use client';
import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowDown, Mail, Hash, Archive, User, Terminal, Atom, Database } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { useState } from 'react';
import Link from 'next/link';

const social = [
  { icon: FaGithub, href: 'https://github.com/SanshuiBot', label: 'GitHub' },
  { icon: Mail, href: 'mailto:localhost6@foxmail.com', label: 'Email' },
];

const techStack = [
  { icon: Terminal, label: 'Next.js' },
  { icon: Atom, label: 'React' },
  { icon: Database, label: 'TypeScript' },
];

export default function HeroScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 400], [0, 80]);
  const [ctaDir, setCtaDir] = useState<'left' | 'right' | 'center'>('center');
  const btnRef = useRef<HTMLAnchorElement>(null);
  const btnX = useMotionValue(0);
  const btnY = useMotionValue(0);
  const sBtnX = useSpring(btnX, { stiffness: 200, damping: 18 });
  const sBtnY = useSpring(btnY, { stiffness: 200, damping: 18 });

  const onBtnMove = (e: React.MouseEvent) => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    btnX.set(dx * 10);
    btnY.set(dy * 10);
    setCtaDir(dx < -0.3 ? 'left' : dx > 0.3 ? 'right' : 'center');
  };
  const onBtnLeave = () => {
    btnX.set(0);
    btnY.set(0);
    setCtaDir('center');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0,
      h = 0;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      hue: number;
    }[] = [];
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const count = Math.min(60, Math.floor((w * h) / 15000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        hue: [280, 320, 200, 170, 40][Math.floor(Math.random() * 5)]!,
      });
    }
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},70%,65%,${p.alpha})`;
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i]!.x - particles[j]!.x;
          const dy = particles[i]!.y - particles[j]!.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i]!.x, particles[i]!.y);
            ctx.lineTo(particles[j]!.x, particles[j]!.y);
            ctx.strokeStyle = `rgba(168,85,247,${0.04 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <motion.section
      ref={sectionRef}
      style={{ opacity, y }}
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] rounded-full bg-accent-violet/5 blur-[150px] animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] rounded-full bg-accent-pink/4 blur-[130px] animate-float-delayed pointer-events-none" />
      <div
        className="absolute top-1/2 right-1/3 w-[25rem] h-[25rem] rounded-full bg-accent-blue/4 blur-[100px] animate-float pointer-events-none"
        style={{ animationDelay: '3s' }}
      />
      <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Status badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-white/5 mb-10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-gray-400 font-medium">在线创作中</span>
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6">
            <span className="block text-white">你好，我是</span>
            <span className="block mt-3 text-aurora">三水</span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            用文字沉淀知识，用代码改变世界。
          </motion.p>

          {/* Identity tagline + Tech stack badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.48 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
          >
            <span className="text-sm text-gray-500 tracking-wide">全栈开发者</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="text-sm text-gray-500 tracking-wide">技术写作者</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="text-sm text-gray-500 tracking-wide">开源爱好者</span>
            <div className="w-full sm:w-auto flex items-center justify-center gap-2 mt-2 sm:mt-0 sm:ml-2">
              {techStack.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] text-gray-500"
                >
                  <Icon size={10} />
                  {label}
                </span>
              ))}
            </div>
          </motion.div>

          {/* CTA + Social */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-12"
          >
            <motion.a
              ref={btnRef}
              href="#posts"
              onMouseMove={onBtnMove}
              onMouseLeave={onBtnLeave}
              style={{ x: sBtnX, y: sBtnY }}
              className="group relative inline-flex items-center gap-3 px-7 py-3 rounded-full bg-white text-black font-semibold text-sm"
            >
              <span
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    ctaDir === 'left'
                      ? 'linear-gradient(135deg,rgba(168,85,247,0.15),transparent 60%)'
                      : ctaDir === 'right'
                        ? 'linear-gradient(225deg,rgba(255,110,199,0.15),transparent 60%)'
                        : 'linear-gradient(180deg,rgba(168,85,247,0.1),transparent 60%)',
                }}
              />
              <span className="relative z-10">浏览文章</span>
              <span className="relative z-10 opacity-40 group-hover:opacity-80 transition-opacity">
                <ArrowDown size={14} />
              </span>
            </motion.a>
            <div className="flex items-center gap-1">
              {social.map(({ icon: Icon, href, label }) => (
                <motion.div
                  key={label}
                  className="relative"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                  whileHover={{ y: -2 }}
                >
                  <motion.a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    aria-label={label}
                    className="relative block p-3 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                  >
                    <Icon size={18} />
                  </motion.a>
                  {/* Tooltip label */}
                  <motion.span
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-500 whitespace-nowrap pointer-events-none"
                    initial={{ opacity: 0, y: 2 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {label}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick nav pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {[
              { href: '/tags', icon: Hash, label: '标签导航', color: '#a855f7' },
              { href: '/archive', icon: Archive, label: '文章归档', color: '#38bdf8' },
              { href: '/about', icon: User, label: '关于我', color: '#2dd4bf' },
            ].map(({ href, icon: Icon, label, color }) => (
              <motion.div
                key={label}
                whileHover={{ y: -4, scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14 }}
              >
                <Link
                  href={href}
                  className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-full glass border border-white/5 overflow-hidden"
                >
                  {/* Hover glow backdrop */}
                  <motion.span
                    className="absolute inset-0 rounded-full pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                    style={{
                      background: `radial-gradient(80px circle at center, ${color}18, transparent 70%)`,
                    }}
                  />
                  {/* Icon */}
                  <motion.span
                    whileHover={{ rotate: 8, scale: 1.2 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 12 }}
                    className="relative"
                    style={{ color }}
                  >
                    <Icon size={12} />
                  </motion.span>
                  {/* Label */}
                  <motion.span
                    className="relative text-xs font-medium"
                    style={{ color: '#78716c' }}
                    whileHover={{ color: '#fff' }}
                    transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                  >
                    {label}
                  </motion.span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[14px] text-gray-600 tracking-[0.2em] uppercase font-mono">
          滚动探索
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown size={13} className="text-gray-500" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
