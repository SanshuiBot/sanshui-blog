"use client";
import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, Code2, Mail, MapPin } from "lucide-react";
import { useState } from "react";

const social = [
  { icon: Code2, href: "https://github.com/SanshuiBot", label: "GitHub" },
  { icon: Mail, href: "mailto:localhost6@foxmail.com", label: "Email" },
  { icon: MapPin, href: "#", label: "Location" },
];

export default function HeroScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 400], [0, 80]);
  const [ctaDir, setCtaDir] = useState<"left" | "right" | "center">("center");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = 0, h = 0;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number; hue: number }[] = [];
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight };
    resize();
    window.addEventListener("resize", resize);
    const count = Math.min(60, Math.floor((w * h) / 15000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        hue: [280, 320, 200, 170, 40][Math.floor(Math.random() * 5)]!,
      });
    }
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
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
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) };
  }, []);

  return (
    <motion.section ref={sectionRef} style={{ opacity, y }} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] rounded-full bg-accent-violet/5 blur-[150px] animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] rounded-full bg-accent-pink/4 blur-[130px] animate-float-delayed pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-[25rem] h-[25rem] rounded-full bg-accent-blue/4 blur-[100px] animate-float pointer-events-none" style={{ animationDelay: "3s" }} />
      <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-white/5 mb-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-gray-400 font-medium">在线创作中</span>
          </motion.div>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6">
            <span className="block text-white">你好，我是</span>
            <span className="block mt-3 text-aurora">三水</span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            用文字沉淀知识，用代码改变世界。
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.55 }} className="flex flex-wrap items-center justify-center gap-4">
            <motion.a
              href="#posts"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                setCtaDir(x < rect.width / 3 ? "left" : x > (rect.width * 2) / 3 ? "right" : "center");
              }}
              onMouseLeave={() => setCtaDir("center")}
              className="group relative inline-flex items-center gap-3 px-7 py-3 rounded-full bg-white text-black font-semibold text-sm transition-all duration-300"
            >
              <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: ctaDir === "left" ? "linear-gradient(135deg,rgba(168,85,247,0.15),transparent 60%)" :
                             ctaDir === "right" ? "linear-gradient(225deg,rgba(255,110,199,0.15),transparent 60%)" :
                             "linear-gradient(180deg,rgba(168,85,247,0.1),transparent 60%)",
                }}
              />
              <span className="relative z-10">浏览文章</span>
              <motion.span
                className="relative z-10 opacity-40 group-hover:opacity-80 transition-opacity"
                animate={{
                  x: ctaDir === "right" ? 0 : 0,
                  rotate: ctaDir === "left" ? -45 : ctaDir === "right" ? 45 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <ArrowDown size={14} />
              </motion.span>
            </motion.a>
            <div className="flex items-center gap-1">
              {social.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} aria-label={label} className="p-3 rounded-full text-gray-500 hover:text-white hover:bg-white/5 transition-all active:scale-95">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
