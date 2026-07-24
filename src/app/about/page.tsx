"use client";
import { ArrowLeft, Mail, Sparkles, Heart, Code2, Server, Wrench } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";

const skills = [
  { label: "Next.js", level: 90, color: "from-accent-pink to-accent-rose" },
  { label: "React", level: 92, color: "from-accent-violet to-accent-pink" },
  { label: "TypeScript", level: 85, color: "from-accent-blue to-accent-violet" },
  { label: "Tailwind CSS", level: 95, color: "from-accent-teal to-accent-blue" },
  { label: "Node.js", level: 80, color: "from-accent-gold to-accent-rose" },
  { label: "Python", level: 70, color: "from-accent-violet to-accent-blue" },
];

const stack = [
  {
    title: "前端", icon: Code2,
    items: [
      { name: "Next.js", level: 5 }, { name: "React", level: 5 },
      { name: "TypeScript", level: 4 }, { name: "Tailwind CSS", level: 5 },
      { name: "Framer Motion", level: 4 },
    ],
    color: "from-accent-pink to-accent-rose",
  },
  {
    title: "后端", icon: Server,
    items: [
      { name: "Node.js", level: 4 }, { name: "Python", level: 3 },
      { name: "SQLite", level: 3 }, { name: "REST API", level: 4 },
    ],
    color: "from-accent-violet to-accent-blue",
  },
  {
    title: "工具", icon: Wrench,
    items: [
      { name: "Git", level: 5 }, { name: "Docker", level: 3 },
      { name: "VS Code", level: 5 }, { name: "Vite", level: 4 },
    ],
    color: "from-accent-teal to-accent-gold",
  },
];

const btnClass = "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-8 group/back">
        <ArrowLeft size={14} />返回首页
      </Link>
      <div className="relative mb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-pink uppercase tracking-widest mb-4"><Sparkles size={12} />关于</span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">你好，我是<span className="text-aurora">三水</span></h1>
      </div>
      <div className="prose-article mb-16">
        <p>一个热爱技术和写作的人。用文字沉淀知识，用代码改变世界。</p>
        <p>这个博客由 Next.js + MDX 构建，托管在 GitHub Pages 上。</p>
      </div>

      {/* Skills */}
      <div className="mb-16">
        <h2 className="text-xl font-bold text-white mb-6">技能</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {skills.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-300">{s.label}</span><span className="text-gray-600">{s.level}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div className={`h-full rounded-full bg-gradient-to-r ${s.color}`} initial={{ width: 0 }} whileInView={{ width: `${s.level}%` }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tech stack cards */}
      <div className="mb-16">
        <h2 className="text-xl font-bold text-white mb-6">技术栈</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stack.map((s, catIdx) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIdx * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
              className="relative p-5 rounded-2xl glass border border-white/5 hover:border-white/20 overflow-hidden group"
            >
              <motion.div
                className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${s.color}`}
                initial={{ scaleX: 0, opacity: 0 }}
                whileHover={{ scaleX: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 16 }}
                style={{ transformOrigin: "left" }}
              />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <s.icon size={15} className="text-gray-500" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-widest">{s.title}</h3>
                </div>
                <span className="text-[11px] font-medium text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{s.items.length} 项</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.items.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2, scale: 1.04 }}
                    className="relative"
                  >
                    <div className="relative px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] transition-colors cursor-default">
                      <div className={`absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-r-full bg-gradient-to-b ${s.color}`} />
                      <div className="flex items-center gap-2 pl-2">
                        <span className="text-sm text-gray-300">{item.name}</span>
                        <div className="flex items-center gap-[2px]">
                          {Array.from({ length: 5 }, (_, di) => (
                            <span
                              key={di}
                              className={`w-1 h-1 rounded-full transition-colors ${
                                di < item.level ? "bg-white/40" : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="p-8 rounded-3xl border border-white/5 glass-heavy hover:border-white/20"
      >
        <h2 className="text-xl font-bold text-white mb-3">联系我</h2>
        <p className="text-gray-400 mb-6">如果你有任何问题或想法，欢迎通过以下方式联系我。</p>
        <div className="flex flex-wrap gap-3">
          <motion.a
            href="https://github.com/SanshuiBot" target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className={`${btnClass} bg-white text-black`}
          ><FaGithub size={16} />GitHub</motion.a>
          <motion.a
            href="mailto:localhost6@foxmail.com"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className={`${btnClass} bg-white/5 text-gray-300 border border-white/10 hover:border-accent-violet/40`}
          ><Mail size={16} />Email</motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className={`${btnClass} bg-white/5 text-gray-300 border border-white/10 hover:border-accent-pink/40`}
          ><Heart size={16} className="text-accent-pink" />赞助我</motion.a>
        </div>
      </motion.div>
    </div>
  );
}
