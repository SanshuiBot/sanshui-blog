<p align="center">
  <img src="https://raw.githubusercontent.com/SanshuiBot/sanshui-blog/main/public/favicon.svg" width="80" alt="三水" />
</p>

<h1 align="center">三水博客</h1>
<p align="center">
  暗色玻璃态 · 极光渐变 · 粒子动效 · 全栈个人博客
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs&logoColor=white" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white" /></a>
  <a href="https://www.framer.com/motion"><img src="https://img.shields.io/badge/Framer_Motion-12-0055FF?logo=framer&logoColor=white" /></a>
  <a href="https://github.com/SanshuiBot/sanshui-blog/actions"><img src="https://img.shields.io/github/actions/workflow/status/SanshuiBot/sanshui-blog/deploy.yml?branch=main&label=deploy" /></a>
  <a href="https://sanshuibot.github.io/sanshui-blog"><img src="https://img.shields.io/website?url=https%3A%2F%2Fsanshuibot.github.io%2Fsanshui-blog&label=live" /></a>
</p>

---

## ✨ 设计

**Aurora 暗色主题** — 全暗色玻璃态设计系统，极光渐变、Canvas 粒子网络、自定义鼠标光晕、逐帧平滑动画。

| | |
|---|---|
| 🎨 **暗色玻璃态** | `backdrop-filter: blur(20px)` 卡片，半透明边框 |
| 🌈 **极光渐变文字** | 多色渐变 + `background-clip: text` 动画 |
| ✨ **Canvas 粒子背景** | 60 节点粒子网络，动态连线 |
| 🖱️ **自定义鼠标光晕** | 延迟跟随的径向渐变光晕 + 小圆点 |
| 📐 **渐隐网格** | `radial-gradient` mask 从中心向四周淡出 |
| 💫 **中心光晕** | 三层极光色径向渐变叠加 |
| 🃏 **3D 倾斜卡片** | `useMotionValue` + `rotateX/Y` 鼠标视差 |
| 🔍 **⌘K 搜索** | 全局快捷键搜索，模糊匹配 |

## 🧱 架构

```
src/
├── app/                  # Next.js App Router 页面
│   ├── page.tsx          # 首页：Hero(粒子) + Stats + Featured + PostList
│   ├── about/            # 关于：技能条动画 + 技术栈卡片
│   ├── archive/          # 归档：按年份分组 + Timeline
│   ├── tags/             # 标签：动态缩放云 + [tag] 筛选
│   ├── posts/[slug]/     # 文章：Server MDX 渲染 + Client 外壳
│   └── links/            # 友链卡片
├── components/
│   ├── Layout/           # Navbar(浮动玻璃态) · Footer(渐变边框) · ScrollProgress
│   ├── Home/             # HeroScene(粒子Canvas) · StatsGrid · FeaturedPost(鼠标追光)
│   ├── Post/             # PostCard(3D倾斜) · PostContent(RSC MDX) · PostMeta(Client)
│   └── UI/               # CursorGlow · SearchModal(⌘K) · ThemeToggle
├── lib/                  # posts.ts(FS缓存) · types.ts · utils.ts
└── content/posts/        # Markdown 文章（Gray Matter frontmatter）
```

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 开发模式（带 HMR 热更新）
npm run dev

# 生产构建 + Pagefind 搜索索引
npm run build

# 预览静态导出
npx serve out
```

## 📝 添加文章

在 `content/posts/` 下新建 `.md` 文件：

```markdown
---
title: 文章标题
date: 2026-01-01
tags: [前端, TypeScript]
excerpt: 一句话摘要，不写则自动取正文前 160 字
---

## 正文开始

支持 GFM 表格、代码高亮、自动标题锚点。
```

## 🔧 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | Next.js 15 (App Router, SSG) |
| 语言 | TypeScript 5 (strict) |
| 样式 | Tailwind CSS v4 + `@theme` 自定义设计令牌 |
| 动画 | Framer Motion 12 (spring, scroll, 3D tilt) |
| 3D | Three.js + `@react-three/fiber` + `@react-three/drei` |
| 图标 | Lucide React |
| 内容 | MDX (`next-mdx-remote/rsc`, remark-gfm, rehype-highlight) |
| 搜索 | Pagefind (静态全文搜索，43 页索引) |
| 部署 | GitHub Pages + GitHub Actions 自动 CI/CD |

## 📦 部署

每次推送到 `main` 分支，GitHub Actions 自动执行：

```yaml
npm install → npm run build → Upload artifact → Deploy to Pages
```

构建产物：Next.js `output: 'export'` 静态 HTML + Pagefind 搜索索引。

---

<p align="center">
  <sub>Built with ♥ by <a href="https://github.com/SanshuiBot">三水</a> · <a href="https://sanshuibot.github.io/sanshui-blog">Live Site</a></sub>
</p>
