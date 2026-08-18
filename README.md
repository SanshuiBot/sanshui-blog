<p align="center">
  <img src="https://raw.githubusercontent.com/SanshuiBot/sanshui-blog/main/public/favicon.svg" width="80" alt="三水" />
</p>

<h1 align="center">三水博客</h1>

<p align="center">
  极光玻璃态 · 渐变光晕 · 物理动效 · 全静态个人博客（默认亮色，暗色可选）
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.3-black?logo=nextdotjs&logoColor=white" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white" /></a>
  <a href="https://www.framer.com/motion"><img src="https://img.shields.io/badge/Framer_Motion-12-0055FF?logo=framer&logoColor=white" /></a>
  <a href="https://github.com/SanshuiBot/sanshui-blog/actions"><img src="https://img.shields.io/github/actions/workflow/status/SanshuiBot/sanshui-blog/deploy.yml?branch=main&label=deploy" /></a>
  <a href="https://sanshuibot.github.io/sanshui-blog"><img src="https://img.shields.io/website?url=https%3A%2F%2Fsanshuibot.github.io%2Fsanshui-blog&label=live" /></a>
</p>

---

## 目录

- [设计理念](#-设计理念)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [添加文章](#-添加文章)
- [📄 个人简历模块](#-个人简历模块)
- [🎨 Accent 主题强调色系统](#-accent-主题强调色系统)
- [部署](#-部署)
- [开发注意事项](#-开发注意事项)

---

## ✨ 设计理念

**Aurora 玻璃态设计系统** — 默认亮色、暗色可选，极光渐变与物理动效深度融合。

|                          |                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------- |
| 🎨 **玻璃态卡片**        | `backdrop-filter: blur(20px)` 半透明卡片，微光边框（亮/暗双主题）                      |
| 🌈 **极光渐变文字**      | 多色渐变 + `background-clip: text` 动画                                                |
| 🖱️ **自定义鼠标光晕**    | CSS `radial-gradient` 延迟跟随的光晕 + 小圆点                                          |
| 📐 **渐隐网格背景**      | `radial-gradient` mask 从中心向四周淡出                                                |
| 💫 **中心极光光晕**      | 三层极光色径向渐变叠加动画                                                             |
| 🃏 **3D 倾斜卡片**       | `useMotionValue` + spring 物理模拟鼠标视差                                             |
| 🔍 **⌘K 全局搜索**       | 运行时 fetch `posts-index.json` 轻量索引；Pagefind 另建全文索引（两套独立机制）        |
| 📜 **阅读进度条**        | 滚动驱动的渐变进度指示器                                                               |
| 🧭 **自动目录**          | 文章 h2/h3 自动提取 + 滚动高亮锚点 + 桌面右栏 sticky + 移动端抽屉 + 淡入淡出滚动条     |
| 💬 **Giscus 评论**       | GitHub Discussions 驱动，零后端；og:title 映射 + strict 摘要查找；亮暗主题联动         |
| 🎯 **三水 favicon**      | 三片紫蓝渐变椭圆花瓣 + 中心圆点，配米白背景，呼应「三水」之名                          |
| 📜 **流式打印简历**      | 终端式逐行打印 `content/resume.md`，暗/亮双主题适配                                    |
| 🎨 **Accent 主题强调色** | 5 个预设调色板 + 6 通道自定义色板，运行时换色全站联动                                  |
| 🌊 **视差拼贴首屏**      | 3 深度层（流光网格 / 文章缩略图墙 / 标题 CTA）滚动视差，缩略图墙运行时 fetch 最新 6 篇 |

---

## 🔧 技术栈

| 类别       | 技术                                                             |
| ---------- | ---------------------------------------------------------------- |
| **框架**   | Next.js 16.3 (App Router, SSG 静态导出)                          |
| **运行时** | React 19 (Server Components / Hooks，`react-dom` 服务端渲染)     |
| **语言**   | TypeScript 5 (strict 模式 + `noUncheckedIndexedAccess`)          |
| **样式**   | Tailwind CSS v4 (`@theme` 自定义设计令牌，无 tailwind.config.js) |
| **动画**   | Framer Motion 12 (spring 物理、滚动驱动、3D 倾斜)                |
| **图标**   | Lucide React + 自定义 SVG 图标（无 react-icons 整包依赖）        |
| **内容**   | MDX (`next-mdx-remote/rsc` + remark-gfm + rehype-highlight)      |
| **搜索**   | Pagefind (静态全文搜索，构建时自动索引)                          |
| **评论**   | Giscus (GitHub Discussions 驱动，零后端)                         |
| **测试**   | Vitest 4（lib 层纯函数与契约单测，`tests/`）                     |
| **部署**   | GitHub Pages + GitHub Actions 自动 CI/CD                         |

---

## 🧱 项目结构

```
sanshui-blog/
├── content/
│   ├── posts/                  # Markdown 文章 (gray-matter frontmatter)
│   │   ├── 深入理解-react-19-并发渲染机制.md
│   │   ├── 金融量化交易系统设计.md
│   │   └── ...
│   └── resume.md               # 个人简历源文件（流式打印模块读取）
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── page.tsx            # 首页 (Hero + Stats + Featured + PostList)
│   │   ├── layout.tsx          # 根布局 (Providers/AmbientEffects/AppShell + favicon metadata + 防 FOUC accent 脚本)
│   │   ├── fonts.ts            # Inter + JetBrains Mono 字体配置
│   │   ├── not-found.tsx       # 404 页面 (粒子动画)
│   │   ├── about/              # 关于页 (技能条 + 技术栈 + 流式简历)
│   │   ├── archive/            # 归档 (按年份分组)
│   │   ├── tags/               # 标签云 + 按标签筛选
│   │   ├── posts/[slug]/       # 文章详情 (RSC MDX 渲染，含 loading.tsx 骨架屏)
│   │   └── links/              # 友链
│   ├── styles/                 # 全站 CSS（集中存放，禁止组件目录散落 .css 文件）
│   │   ├── globals.css         # Tailwind v4 + 自定义设计系统 + 全局 reset + prefers-reduced-motion
│   │   ├── terminal-base.css   # TerminalShell 共享外壳（毛玻璃窗口 + macOS 标题栏红黄绿圆点）
│   │   ├── terminal-links.css  # 友链卡片特有（terminal-body / prompt / 网格 / 卡片）
│   │   └── resume-terminal.css # 简历内容区（变量 + 暗/亮双主题覆盖）
│   ├── components/
│   │   ├── Providers.tsx       # 纯 Context 组合 (next-themes + 导航加载)
│   │   ├── AmbientEffects.tsx  # 全局动效注册表 (懒加载 + reduced-motion 兜底)
│   │   ├── AppShell.tsx        # 布局壳 (Navbar + main + Footer)
│   │   ├── Layout/             # Navbar · Footer · ScrollProgress
│   │   ├── Home/               # HeroParallax（视差拼贴首屏，3 深度层）· HomeHydration（懒加载入口）· PostsList
│   │   ├── Post/               # PostCard · PostContent · PostMeta · PostNav · PostDone · PostComments (Giscus 评论) · TableOfContents · CodeCopyInjector
│   │   ├── About/              # AboutContent · ResumeTerminal (流式打印简历)
│   │   ├── Links/ · NotFound/
│   │   └── UI/                 # CursorGlow · ClickEffect · ParticleField · AccentPicker · SearchModal · ThemeToggle · Tooltip · NavigationLoading · SpinRing (共用加载环) · GithubIcon · useDismiss
│   └── lib/
│       ├── types.ts            # Post 类型定义（server-only）
│       ├── posts.ts            # 文章读取（单次装载，无 mtime 缓存；slug 解码统一兜底）
│       ├── parse-post.mjs      # 文章解析契约唯一实现（posts.ts 与索引脚本共用）
│       ├── toc.ts              # h2/h3 提取（github-slugger 与渲染侧 rehype-slug 同源）
│       ├── resume.ts           # 简历读取（构建期 fs.readFileSync，含 node:fs）
│       ├── resumeLines.ts      # 简历行切分纯函数（客户端安全）
│       ├── accents.ts          # Accent 预设/解析/应用 + 防 FOUC 脚本生成
│       ├── site.ts             # 站点身份配置（url/emailHref 等派生字段）
│       ├── basePath.ts         # basePath 中心定义 + withBase()
│       ├── thumbGeometry.ts    # TOC 滚动指示条几何纯函数
│       └── clickParticles.ts   # 点击特效粒子物理纯函数
├── tests/                      # Vitest 单测（lib 层纯函数与契约）
├── scripts/
│   ├── predev.js               # ConsoleNinja 兼容：生成 .next/routes-manifest.json
│   ├── gen-posts-index.js      # 生成 public/posts-index.json 轻量索引 (解析契约来自 parse-post.mjs)
│   └── gen-dotted-tag-payloads.js # 为含点号标签 (如 Next.js) 补 RSC payload 副本，避免线上 404
├── .github/workflows/deploy.yml # GitHub Actions 自动部署
└── public/                     # 静态资源 (favicon.svg/ico · posts-index.json · _headers)
```

---

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器 (HMR 热更新)
npm run dev
# → http://localhost:3000

# 生产构建 (静态导出 + Pagefind 搜索索引)
npm run build

# 预览构建产物
npx serve out
```

### 可用命令

| 命令                   | 作用                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`          | 开发模式，`predev` 自动生成 ConsoleNinja 兼容的路由清单 + 文章索引（`--webpack` 绕开 Turbopack 的 Tailwind v4.3 CSS 解析问题） |
| `npm run build`        | 静态导出 + Pagefind 索引，通过 `NEXT_BUILD=1` 环境变量开启                                                                     |
| `npm run start`        | Next.js 生产服务器（本项目为纯静态导出，通常不用，静态托管在任意 HTTP 服务器即可）                                             |
| `npm run lint`         | ESLint v9 flat config，只报告不修改                                                                                            |
| `npm run lint:fix`     | 运行 ESLint 并自动修复可修复的问题                                                                                             |
| `npm run format`       | 用 Prettier 原地格式化全项目文件                                                                                               |
| `npm run format:check` | 用 Prettier 只检查不修改（CI 中常用）                                                                                          |
| `npm run typecheck`    | `tsc --noEmit` 类型检查（Next 16 构建不跑 lint，CI/本地须单独跑 lint + typecheck）                                             |
| `npm run test`         | Vitest 跑 lib 层单测（纯函数与契约，当前 96 个）                                                                               |
| `npx serve out`        | 本地起 HTTP 服务器预览 `out/` 静态产物                                                                                         |

> 🔒 **提交门禁**：Husky pre-commit 自动跑 `lint-staged`（Prettier 格式化暂存文件）→ `npm run typecheck` → `npm run test`。

### 构建脚本流程

```
npm run dev
  └─ predev → 生成 .next/routes-manifest.json (ConsoleNinja 兼容)
  └─ next dev (HMR，无 basePath/assetPrefix)

npm run build
  └─ prebuild → 生成 public/posts-index.json (~10KB 轻量索引)
  └─ cross-env NEXT_BUILD=1 next build --webpack → 静态导出 out/
  └─ pagefind --site out → 全文搜索索引（与 ⌘K 的 posts-index.json 是两套独立机制）
  └─ gen-dotted-tag-payloads.js → 为含点号标签（如 Next.js）补 RSC payload 副本，避免线上 404
```

---

## 📝 添加文章

在 `content/posts/` 下新建 `.md`（或 `.mdx`）文件即可。文件名即 slug，建议中文+连字符命名以保持 URL 可读性（如 `深入理解-react-19-并发渲染机制.md`）。TOC 自动从 `##` / `###` 提取，rehype-highlight 自动代码高亮，`CodeCopyInjector` 在客户端给代码块注入复制按钮。

```markdown
---
title: 文章标题
date: 2026-01-01
tags: [前端, TypeScript]
excerpt: 一句话摘要（可选，不写则自动取正文前 160 字；含代码块开头的文章建议显式写）
---

## 章节标题（自动生成目录锚点）

正文内容…

支持 GFM 表格、代码高亮、自动标题锚点。
```

**Frontmatter 字段：**

| 字段      | 类型     | 必填 | 说明                      |
| --------- | -------- | ---- | ------------------------- |
| `title`   | string   | ✅   | 文章标题                  |
| `date`    | string   | ✅   | `YYYY-MM-DD`，用于排序    |
| `tags`    | string[] | ❌   | 标签列表，驱动 `/tags` 页 |
| `excerpt` | string   | ❌   | 摘要，不写则自动截取      |

> 💡 新增/修改文章后，`predev` 或 `prebuild` 钩子会自动重新生成 `public/posts-index.json`，SearchModal 即可搜索到新文章。但**线上 HTML 只在重新 `npm run build` 后更新**。

> ⚠️ 文章排版样式走 `src/styles/globals.css` 里手写的 `.prose-article` 类（h1/h2/h3 字号颜色、`a` 紫粉渐变、`code` 紫底、`blockquote` 紫边等），**未用 Tailwind Typography 的 `prose` 类**。改文章样式就改 `.prose-article` 这段 CSS。

---

## 📄 个人简历模块

关于页（`/about`）内置一个**终端式流式打印简历**模块：进入视口后，简历内容会一行行像终端 `cat` 输出般逐行打印，直至完整呈现。

### 工作原理

```
content/resume.md  ──(构建期 fs.readFileSync)──►  src/lib/resume.ts
                                                          │
                                                          ▼
src/app/about/page.tsx ──(注入 markdown prop)──►  AboutContent
                                                          │
                                                          ▼
                                          src/components/About/ResumeTerminal.tsx
                                          (IntersectionObserver 触发 + setTimeout 逐行打印)
```

- **数据源**：`content/resume.md`（纯 Markdown，约 4KB）
- **读取时机**：构建期同步读取（`src/lib/resume.ts`，含 `node:fs`，客户端组件勿 import），注入 `AboutContent` 作为 `resumeMarkdown` prop
- **行切分**：`splitResumeLines` 在 `src/lib/resumeLines.ts`（无 fs、客户端安全），`ResumeTerminal` 逐行打印用它
- **动画触发**：`IntersectionObserver` 监听组件进入视口（threshold 0.2），首次进入即启动打印
- **打印节奏**：`setTimeout` 调度，空行 0.4×、标题行 2.4×、普通行 1×（默认 `lineDelay = 60ms`）
- **自动滚动**：每打印一行自动 `scrollTop = scrollHeight`，模拟终端追加
- **双主题适配**：`src/styles/resume-terminal.css` 用 CSS 变量定义 `.resume-terminal` 暗/亮两套配色，`html:not(.dark)` 覆盖亮色值

### 渲染能力

| Markdown 语法  | 渲染效果                    |
| -------------- | --------------------------- |
| `# / ## / ###` | 紫色高亮标题，层级决定字号  |
| `- xxx`        | 青色圆点列表项              |
| `> xxx`        | 粉色左边框引用块            |
| `---`          | 灰色分隔线                  |
| `**粗体**`     | 加粗白色文字                |
| `` `代码` ``   | 浅紫底 + 紫色文字的行内代码 |

### 性能特征

- **零运行时 fetch**：简历文本在构建期注入静态 HTML，无 API 路由、无网络请求
- **路由级代码分割**：`ResumeTerminal` 仅被 `/about/` 路由按需加载，首页/文章/标签页 JS bundle 不含此组件
- **动画不阻塞渲染**：`setTimeout` 调度对主线程几乎零负担，`IntersectionObserver` 仅触发一次
- **静态导出场景零运行时开销**：about 页面在 `npm run build` 时已预渲染为静态 HTML

### 修改简历

直接编辑 `content/resume.md` 即可，无需改代码。支持的标准 Markdown 语法见上表。下次 `npm run dev` 或 `npm run build` 自动生效。

---

## 🎨 Accent 主题强调色系统

全站 6 个 accent 色（pink/violet/blue/teal/gold/rose）通过 CSS 变量 `--accent-*-rgb`（空格分隔 RGB 三元组，如 `168 85 247`）驱动。所有阴影、glow、hljs 高亮、prose-article 链接、terminal-links / resume-terminal 组件、Aurora 文字渐变均经由 `rgb(var(--accent-xxx-rgb) / α)` 引用——**改这 6 个变量 = 全站联动**。

### 机制链路

| 层      | 文件                                                  | 职责                                                                                                |
| ------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 数据    | `src/lib/accents.ts`                                  | 5 个预设（极光/翡翠/落日/深海/樱影）+ 自定义预设 + `applyAccent()`/`hexToRgb()`/`getCustomPreset()` |
| UI      | `src/components/UI/AccentPicker.tsx`                  | Navbar 上的 🎨 图标，Popover 上半列 5 个预设，下半「自定义」区 6 个 `<input type="color">`          |
| 防 FOUC | `src/lib/accents.ts` 生成 + `src/app/layout.tsx` 内联 | `<head>` 内联 `accentBootstrapScript`，首屏前同步读 `aurora-accent`，写 6 个 `--accent-*-rgb`       |

### 持久化

- `aurora-accent`：存当前激活预设 id（`aurora`/`emerald`/`sunset`/`ocean`/`sakura`/`custom`）
- `aurora-accent-custom`：存自定义预设 JSON（6 个通道的 RGB 三元组）

### 新增需要 accent 色的代码

| 场景                         | 做法                                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 新增 CSS 用 accent 色        | `rgb(var(--accent-xxx-rgb) / α)`，**不要**写死 `rgba(168, 85, 247, ...)` 或 `#a855f7`                                                     |
| 新增 hover 变色              | **用纯 CSS**（自定义类 + `:hover`），**不要走 Framer Motion** `whileHover`（详见开发注意事项）                                            |
| 新增需要联动 accent 的 hover | **不要用 Tailwind utility**（`group-hover/link:text-accent-violet`），改用自定义 CSS 类，`html.dark` / `html:not(.dark)` 双前缀提升特异性 |
| 新增预设                     | 在 `ACCENT_PRESETS`（`src/lib/accents.ts`）追加一项，inline script 已内联全部预设无需改 layout                                            |
| 改默认预设                   | 改 `DEFAULT_ACCENT_ID`，inline script 的 `def` 也会跟着走                                                                                 |

> ⚠️ inline script 里 `presets` JSON 是构建期固化的，**新增预设后必须重新 `npm run build`** 才能被防 FOUC script 识别。

---

## 📦 部署

每次推送到 `main` 分支，GitHub Actions 自动执行：

```mermaid
graph LR
  A["git push main"] --> B["GitHub Actions"]
  B --> C["Node 24 + npm ci"]
  C --> D["prebuild: 生成文章索引"]
  D --> E["npm run build"]
  E --> F["静态导出 out/"]
  F --> G["Pagefind 搜索索引"]
  G --> H["Upload ./out Artifact"]
  H --> I["Deploy to GitHub Pages"]
```

CI 配置见 `.github/workflows/deploy.yml`：Node 24、`npm ci` 严格安装、`npm run build` 静态导出、`actions/upload-pages-artifact@v3` 上传 `./out`、`actions/deploy-pages@v4` 部署。`concurrency.group: "pages"` + `cancel-in-progress: false` 保证部署串行不中断。

**部署特征：**

- 纯静态 HTML 输出（`output: 'export'`），无需 Node.js 服务器
- Pagefind 在构建后自动索引全文搜索
- 安全响应头走 `public/_headers`（`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy`、`Permissions-Policy`）；`output: 'export'` 下 `next.config.ts` 的 `headers()` 不生效
- 静态资源一年长缓存（`/_next/static/*` 与 `/pagefind/*`，`immutable`）

---

## ⚠️ 开发注意事项

- **亮色为主、暗色可选**：默认 **亮色主题**。`next-themes`（`attribute="class"`、`defaultTheme="system"`、`enableSystem`、`storageKey="aurora-theme"`）——未手动切换时跟随系统偏好。CSS 默认状态下 `<html>` 无 `.dark` 类，`src/styles/globals.css` 用大量 `html:not(.dark) ...` 选择器把 body 渲染成亮色（背景 `#fafaf9`、文字 `#1c1917`、玻璃半透明白、shadow 偏淡）。暗色令牌定义在 `@theme` 与 `:root`（`--color-ink` 等），暗色模式下通过 `.dark` 类激活。`ThemeToggle` 调 `setTheme(isDark?'light':'dark')`。`layout.tsx` 的 `viewport` 同步声明亮色值（`colorScheme: 'light'`、`themeColor: '#fafaf9'`），保证浏览器 UA（滚动条/表单控件/地址栏）与默认主题一致。**改暗色变量时同步检查 `html:not(.dark)` 亮色分支**，否则亮色会错乱
- **Tailwind v4 语法**：使用 `@import "tailwindcss"` / `@plugin` / `@theme`，而非 v3 的 `@tailwind` 指令；PostCSS 插件是 `@tailwindcss/postcss`
- **TypeScript 严格**：`strict: true` + `noUncheckedIndexedAccess` + `noUnusedLocals` + `noUnusedParameters`，所有索引访问都需 undefined 检查
- **中文 Slug**：`getPostBySlug()` / `getAdjacentPosts()` 内部经 `decodeSlug()` 统一做 `decodeURIComponent`（非法编码按原样查找、不抛异常）；`generateStaticParams` 返回原始 slug，新增 slug 查询时保持一致
- **导航状态**：通过 `useNavigationLoading` hook（来自 `@/components/UI/NavigationLoading`）管理页面过渡状态，**只有跳转到文章详情页（`/posts/...`）的 `<Link>` 才调用 `startNavigation`** 触发加载指示器（与 AGENTS.md 约定 #13 一致）
- **自定义 Easing 曲线**：Tailwind 主题预定义了 `--ease-out-expo`、`--ease-out-back`、`--ease-in-out-circ`，Framer Motion 动画大量使用 `[0.16, 1, 0.3, 1]` 等自定义曲线
- **静态导出通过环境变量切换**：`next.config.ts` 中 `output: 'export'`、`basePath`、`assetPrefix` **仅**在 `NEXT_BUILD=1` 时生效。`npm run dev` 不会设置此变量，因此开发模式下没有 `basePath`、没有 `assetPrefix`。**不要手动设置 `output: 'export'`**，否则 HMR 会挂
- **basePath 双边一致**：`process.env.NEXT_BUILD` 没有 `NEXT_PUBLIC_` 前缀，Next.js 不会把它 inline 到客户端 bundle。`next.config.ts` 通过 `env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH }` 把 basePath 注入 `NEXT_PUBLIC_BASE_PATH`，Next.js 会 inline 到 SSR + 客户端 bundle 两边，`src/lib/basePath.ts` 读取此变量。新增需要 basePath 的客户端代码时，**必须**走 `withBase()`，不要自己拼 `process.env.NEXT_BUILD`
- **RSC payload 优化**：`getAllPosts()` 已从 `layout.tsx` 移除，文章数据通过 `public/posts-index.json`（~10KB）在 SearchModal 运行时 fetch，避免全量文章数据被序列化进根 layout 的 RSC payload
- **Giscus 评论**：配置集中在 `src/components/Post/PostComments.tsx` 的 `GISCUS_ATTRS`（属性名必须 kebab-case；`mapping='og:title'` + `strict='1'`，讨论按文章标题关联，**改文章标题会使历史评论失联**）；主题用官方 `light`/`dark`；Edge 的「Images loaded lazily」干预警告来自 widget 内部懒加载头像，属 giscus 自身行为、宿主页无法消除
- **重组件懒加载**：`CursorGlow`、`ScrollProgress`、`ClickEffect`、`ParticleField` 等非首屏必需的 client 组件由 `AmbientEffects.tsx` 通过 `next/dynamic` 统一懒加载（`prefers-reduced-motion` 阀门跳过装饰性动效 `CursorGlow`/`ClickEffect`；`ScrollProgress` 保留指示条但 spring 平滑入阀；`ParticleField` 内部自检画静态帧），避免被打进首屏 chunk
- **Turbopack + Tailwind v4.3 不兼容**：Next 16 默认 Turbopack 无法解析 Tailwind v4.3 生成的 `@layer properties` 选择器（`Invalid dangling combinator in selector`），dev/build 脚本已显式加 `--webpack`，不要移除
- **sharp 依赖**：`package.json` 的 `overrides` 锁定 `sharp: "^0.35.3"` 与 `postcss: "^8.5.25"`，保证静态导出 + `images.unoptimized: true` 场景下依赖树稳定
- **`out/` 是构建产物**：`out/` 在 `.gitignore` 中、未被 git 跟踪，是 `npm run build` 的静态导出产物。`out/en/` 等陈旧子树可能是早期英文版 / `[locale]` i18n 路由的构建残留，**源码里已无对应路由**。排查路由时以 `src/app/` 为准，不要把 `out/` 的旧产物当成当前结构，也不要手动清理 `out/`——下次 `build` 会整体覆盖
- **`next.config.ts` 隐式约定**：
  - `images.unoptimized: true`：静态导出无服务端图像优化器，`next/image` 退化为原图直出，新增图片需自行压缩
  - `trailingSlash: true`：所有路由以 `/` 结尾（如 `/posts/xxx/`），`generateStaticParams` 与内部链接拼接都必须遵守，否则线上 404
  - `experimental.optimizePackageImports: ['framer-motion','lucide-react']`：让大库按需引入，**不要再自定义 `splitChunks`**——会与内置 chunk 策略冲突，反而拆出更多碎 chunk
  - `reactStrictMode: true`：开发模式下 effects 会执行两次（mount → unmount → mount），副作用清理逻辑必须幂等
- **安全头走 `public/_headers`**：`output: 'export'` 模式下，`next.config.ts` 的 `headers()` **不会生效**——静态 HTML 由 GitHub Pages 直接返回，不经过 Next。安全响应头（`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy`、`Permissions-Policy`）通过仓库根的 `public/_headers` 配置，Next 静态导出会原样复制到 `out/_headers`，GitHub Pages 会识别。新增响应头改 `public/_headers`，不要改 `next.config.ts`
- **文章卡片网格「跟手」流式渲染**：`PostGrid` + `PostCard` 实现骨架渐隐与卡片渐显**同一 DOM 帧叠加**，零空白帧。关键实现：骨架层与卡片层同时挂载于同一 `h-60`（240px）固定容器，absolute 叠放，只通过 opacity 切换显隐；槽位 key 用 `slot-${i}` 稳定不变，骨架→卡片切换不触发 DOM 卸载/重挂；卡片入场从 `whileInView` 改为挂载即播放（列表场景卡片总是从下方进入视野，等 `IntersectionObserver` 反而不跟手）；两层用完全相同的 transition（`duration: 0.25s`），不用 `y` 位移（会让卡片在途中「露半张」）；`prefetchedRef` 在 `post.slug` 变化时重置（`useEffect`），避免稳定 slot key 复用 PostCard 实例时新文章 hover 跳过 prefetch
- **TOC 只提取 h2/h3，锚点与渲染侧同源**：`src/lib/toc.ts` 的 `extractHeadings()` 逐行扫描，只把 `##` / `###` 放进目录，`#` 与 `####` 不进目录；id 与渲染侧 rehype-slug 共用同一个 `github-slugger`（先剥 HTML 再 `slug()`，h1~h6 全部推进状态，重复标题自动 `-1/-2` 后缀，中文/重音/假名都保留，且**不**折叠重复连字符——与渲染侧严格一致），并跳过代码围栏内的假标题。新增需要进目录的标题，必须用 `##` 或 `###`。TOC 组件实现：桌面端目录 sticky 在正文**右边**（`page.tsx` 正文在前、TOC 在后），移动端抽屉式目录在正文上方；`IntersectionObserver` 监测视口上 30% 带取最靠上标题高亮、首屏高亮首项；点击 `scrollIntoView` 平滚 + `history.replaceState` 写 URL hash；`.prose-article h2/h3 { scroll-margin-top: 6rem }` 兜锚点不被 sticky Navbar 遮挡；**淡入淡出滚动条**——`.toc-scroll` 藏原生滚动条，浮 `.toc-thumb` 绝对定位指示条按滚动比例算 `top`/`height`（几何在 `src/lib/thumbGeometry.ts` 纯函数，可单测），显隐只由 hover 控制（`mouseenter` 显示 / `mouseleave` 隐藏），`opacity transition` 淡入淡出，浮层 `absolute` 不占文档流不挤压文字；几何用 `ResizeObserver` + `requestAnimationFrame` 延迟算准 + `document.fonts.ready` 兜底。颜色联 Accent 主题用自定义 `.toc-link` / `.toc-link-active` 类（见下 utility layer 坑），不用 Tailwind utility `text-accent-violet`
- **CSS 文件集中存放**：所有 `.css` 文件（含 `globals.css`）统一放在 `src/styles/`，组件内通过 JS import 按需引入（`import '@/styles/xxx.css'`），全局样式由 `layout.tsx` 统一 import。**禁止在组件目录里散落 `.css` 文件**。共享外壳（终端窗口）抽为 `TerminalShell` 组件，各页面只传 `title`/`status` prop，不要手抄圆点标题栏
- **`src/styles/globals.css` 同元素规则集中**：同一元素的暗色基与亮色覆盖（`html:not(.dark) ...`）必须相邻写，不散乱到文件两极；不写重复样式。`prose-article` / `glass` / `glass-heavy` / `::-webkit-scrollbar` 的亮色覆盖均已并入暗色基旁，Tailwind utility 亮色覆盖单独分组于文件尾。新增元素的亮色覆盖紧贴其暗色基写
- **`posts.ts` 读取层契约**：
  - `'server-only'` 标记：`posts.ts` / `toc.ts` / `types.ts` 顶部都有 `import 'server-only'`，这些 lib **只能在 RSC / Server Component 里调用**，不能 import 进 client 组件。客户端需要文章数据时 fetch `public/posts-index.json`
  - 共享解析契约：解析规则唯一实现在 `src/lib/parse-post.mjs`（纯 ESM、无 fs），`posts.ts` 与 `scripts/gen-posts-index.js` 共用，改解析只改这一处
  - 单次装载：`getAllPosts()` 首次调用时读目录 → 解析 → 排序，模块级 memo 缓存，**无 mtime 签名缓存**。不要在运行时修改 `content/posts/` 下的文件——修改需重新 `build`（或 dev 重启）才生效
  - excerpt 兜底：未写 `excerpt` 时取正文前 160 字并 `replace(/[#*`\[\]]/g,'')`去掉 markdown 符号，注意这个正则会**误删反引号围栏代码块的内容**，含代码开头的文章建议显式写`excerpt`
- **提交门禁**：Husky pre-commit 自动跑 `lint-staged`（Prettier 格式化暂存文件）→ `npm run typecheck` → `npm run test`；`public/posts-index.json` 是构建产物，已在 `.prettierignore` 忽略，不要手动格式化它
- **弹层关闭统一走 `useDismiss`**：外点（mousedown + 延迟绑定避开「触发弹层的同一次点击」）/ Esc 关闭收口在 `src/components/UI/useDismiss.ts`；ref 须包裹「开关按钮 + 浮层」，Navbar 移动菜单用 `{ outside: false }` 只启用 Esc（开关按钮在浮层外）
- **hover 变色不要走 Framer Motion**：`whileHover={{ color: 'rgb(var(--accent-violet-rgb))' }}` 会把动画后的 `color` 写成 **inline style**，CSS 变量在 inline style 中被解析成具体值（如 `rgb(168 85 247)`）后就**不再响应** `--accent-*-rgb` 的变化——切 Accent 主题色、切亮/暗模式时，标题会卡在动画那一刻的颜色上，看起来像「变白/变黑不响应主题」。**正确做法**：hover 变色用纯 CSS（自定义类 + `:hover`），颜色完全交给 CSS 变量系统；位移动画也一并迁到 CSS `transform`。PostCard 标题（`.post-card-title`）、「阅读」箭头（`.post-card-readmore` + `.post-card-link:hover`）就是这么改的
- **Tailwind v4 utility 的 layer 优先级坑**：Tailwind v4 把 utility 类（`text-gray-500`、`group-hover/link:text-accent-violet` 等）注入到 `@layer utilities` 里。而 `src/styles/globals.css` 中那些 `html:not(.dark)` 亮色覆盖规则是**裸 CSS**（不在任何 `@layer` 内）。**裸 CSS 优先级高于任何 `@layer` 内的同特异性规则**，所以亮色模式下 `group-hover/link:text-accent-violet` 这类 utility hover 会被裸覆盖规则持续压制，hover 不变色。**正确做法**：需要响应 Accent 主题色联动的 hover 变色，**不要用 Tailwind utility**，改用自定义 CSS 类，`html.dark` / `html:not(.dark)` 双前缀提升特异性到 (0,3,1)，稳压裸覆盖规则
- **动画时长限制 0.01ms（`prefers-reduced-motion` 降级值）**：做任何动画之前，先确认它会被 `src/styles/globals.css` 的 `@media (prefers-reduced-motion: reduce)` 块正确降级。该块把 `animation-duration` / `transition-duration` 强制压到 **0.01ms**（实质禁用动画），服务于无障碍：
  ```css
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
  - **0.01ms 是降级值，不是「开销上限」**。它远低于浏览器最小帧时间（一帧约 16.7ms），作用是让动画在 reduced-motion 用户下「瞬间完成」而非「缓慢完成」，避免前庭不适。
  - **纯 CSS 动画自动合规**：用 `transition` / `animation` 实现的 hover、下划线滑入等，会被上面 `*` 选择器 + `!important` 自动压到 0.01ms，无需额外处理。导航图标 hover 放大（`.nav-icon-btn`）、导航链接下划线滑入（`.nav-link::after`）均属此类，合规。
  - **Framer Motion 驱动的动画绕开了这条降级**：Framer 用 JS rAF + inline style 驱动位移（如 PostCard 标题 `whileHover`、ArrowLink 箭头位移），inline style 的 `transform` 不受 `transition-duration` 影响。这是「功能性可见动画」的有意例外——但 hover 变色仍走纯 CSS，不交给 Framer。
  - **新增动画前 checklist**：① 优先纯 CSS（`transition` + `transform`/`opacity`/`width` 等合成层属性），自动被 0.01ms 降级覆盖；② 避免 `transition: all`（会动画非合成属性，触发 layout/paint）；③ 若用 Framer Motion 驱动可见位移，确认该动画在 reduced-motion 下是否应降级——若应降级，改用纯 CSS 或在 `useReducedMotion()` 守卫下跳过；④ hover 变色不交给 Framer。

---

## 📄 License

MIT © 三水

---

<p align="center">
  <sub>Built with ♥ by <a href="https://github.com/SanshuiBot">三水</a> · <a href="https://sanshuibot.github.io/sanshui-blog">Live Site</a></sub>
</p>
