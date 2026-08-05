# AGENTS.md — sanshui-blog

三水的个人博客。Next.js 16.3（App Router，纯静态导出 `output: 'export'`）+ TypeScript 5 strict + Tailwind CSS v4 + Framer Motion 12。托管在 GitHub Pages，basePath 为 `/sanshui-blog`，部署走 `.github/workflows/deploy.yml` 自动 CI/CD。全站暗色「Aurora 玻璃态」设计系统。

---

## 命令

| 用途     | 命令                                      | 备注                                                                                                                                                                                                                                                                                                                                                        |
| -------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 开发     | `npm run dev`                             | `predev` 先跑 `scripts/predev.js`（生成 ConsoleNinja 兼容的 `.next/routes-manifest.json`）+ `scripts/gen-posts-index.js`（生成 `public/posts-index.json`）。开发模式 **不设** `NEXT_BUILD`，因此无 `basePath` / `assetPrefix` / `output:export`；dev 用 `next dev --webpack`（Turbopack 无法解析 Tailwind v4.3 生成 CSS，见约定 #30）。                     |
| 生产构建 | `npm run build`                           | `prebuild` 重新生成 `posts-index.json` → `cross-env NEXT_BUILD=1 next build --webpack`（静态导出到 `out/`；Next 16 构建不再执行 lint，`--webpack` 绕开 Turbopack 的 Tailwind v4.3 CSS 解析问题，见约定 #30）→ `pagefind --site out`（生成全文搜索索引）→ `scripts/gen-dotted-tag-payloads.js`（为含点号标签如 `Next.js` 补 RSC payload 副本，见约定 #27）。 |
| Lint     | `npm run lint` / `npm run lint:fix`       | ESLint v9 flat config（`eslint.config.mjs` 直接 spread eslint-config-next 16 的 flat config：`next/core-web-vitals` + `next/typescript`）。Next 16 构建不跑 lint，CI/本地须单独跑。                                                                                                                                                                         |
| 格式化   | `npm run format` / `npm run format:check` | Prettier：2 空格、单引号、`printWidth: 100`、`trailingComma: "all"`、`endOfLine: "lf"`（见 `.prettierrc`）。                                                                                                                                                                                                                                                |
| 预览产物 | `npx serve out`                           | 本地起 HTTP 服务器看构建结果。                                                                                                                                                                                                                                                                                                                              |
| 类型检查 | `npm run typecheck`                       | `tsc --noEmit`（`tsconfig.json` 开 `strict` + `noUncheckedIndexedAccess` + `noUnusedLocals` + `noUnusedParameters` + `noImplicitOverride`）。                                                                                                                                                                                                               |
| 测试     | `npm run test`                            | Vitest（`vitest run`）：lib 层纯函数与契约测试，见 `tests/`（'server-only' 由 `tests/stubs/server-only.ts` 兜底）。                                                                                                                                                                                                                                         |
| 提交门禁 | `git commit`                              | Husky pre-commit：lint-staged（Prettier 格式化暂存文件）→ `npm run typecheck` → `npm run test`（见 `.husky/pre-commit`）。                                                                                                                                                                                                                                  |

> ⚠️ **不要用 `npm start`**：本项目是纯静态导出，`next start` 无意义，静态托管在任意 HTTP 服务器即可。

---

## 顶层布局

```
sanshui-blog/
├── content/
│   ├── posts/*.md(x)        # 文章源，frontmatter：title/date/tags/excerpt
│   └── resume.md            # 简历源，构建期 fs.readFileSync 注入 /about
├── src/
│   ├── app/                 # App Router 页面（每条路由一个目录）
│   │   ├── layout.tsx       # 根布局：字体、Providers/AmbientEffects/AppShell、metadata、viewport、防 FOUC accent 脚本
│   │   ├── page.tsx         # 首页：Hero + Stats + Featured + 文章网格 + 预取 <link>
│   │   ├── globals.css      # Tailwind v4 @theme 设计令牌 + 各模块样式
│   │   ├── fonts.ts         # Inter (sans) + JetBrains Mono (mono)，next/font
│   │   ├── not-found.tsx    # 404（粒子动画）
│   │   ├── about/           # 关于页（简历流式打印）
│   │   ├── archive/         # 归档（按年份分组）
│   │   ├── tags/[tag]/      # 标签云 + 按标签筛选
│   │   ├── posts/[slug]/    # 文章详情：generateStaticParams + generateMetadata（唯一保留 loading.tsx 骨架屏的路由）
│   │   └── links/           # 友链
│   ├── components/
│   │   ├── Providers.tsx    # 纯 Context 组合：next-themes + NavigationLoadingProvider
│   │   ├── AmbientEffects.tsx # 全局动效注册表：CursorGlow/ClickEffect 等懒加载 + reduced-motion 兜底
│   │   ├── AppShell.tsx     # 布局壳：Navbar + main + Footer
│   │   ├── Layout/          # Navbar · Footer · ScrollProgress
│   │   ├── Home/            # HeroScene · StatsGrid · FeaturedPost
│   │   ├── Post/            # PostCard · PostContent · PostMeta · PostNav · PostDone · TableOfContents · CodeCopyInjector
│   │   ├── About/           # AboutContent · ResumeTerminal
│   │   ├── Links/ · NotFound/
│   │   ├── UI/              # CursorGlow · ClickEffect · ParticleField · AccentPicker · SearchModal · ThemeToggle · Tooltip · NavigationLoading · GithubIcon · useDismiss
│   │   └── TagList.tsx
│   ├── lib/
│   │   ├── types.ts         # Post 接口（'server-only'）
│   │   ├── posts.ts         # getAllPosts/getPostBySlug/getAllTags/getPostsByTag/getAdjacentPosts（单次装载，无 mtime 缓存；slug 解码统一兜底）
│   │   ├── parse-post.mjs   # 文章解析契约唯一实现（纯 ESM）：posts.ts 与 scripts/gen-posts-index.js 共用
│   │   ├── toc.ts           # extractHeadings：github-slugger 与渲染侧 rehype-slug 同源，只输出 ## / ###
│   │   ├── resume.ts        # getResumeMarkdown：构建期同步读取 content/resume.md（含 node:fs，客户端勿 import）
│   │   ├── resumeLines.ts   # splitResumeLines：行切分纯函数（客户端安全，ResumeTerminal 使用）
│   │   ├── accents.ts       # Accent 预设/解析/应用 + 防 FOUC 脚本生成（resolveAccentColors / accentBootstrapScript）
│   │   ├── site.ts          # 站点身份配置（url/emailHref 等派生字段，客户端安全）
│   │   ├── basePath.ts      # BASE_PATH + withBase()（客户端安全，URL 一律走 withBase）
│   │   ├── thumbGeometry.ts # TOC 滚动指示条几何纯函数（TableOfContents 使用）
│   │   └── clickParticles.ts# 点击特效粒子物理纯函数（ClickEffect 使用：easing + 状态推导）
│   └── global.d.ts
├── tests/                    # Vitest 单测：lib 纯函数与契约（accents/toc/posts/basePath/resume/parsePost/thumbGeometry/clickParticles）
├── scripts/
│   ├── predev.js            # ConsoleNinja 兼容：生成 .next/routes-manifest.json
│   └── gen-posts-index.js   # 生成 public/posts-index.json（解析契约来自 parse-post.mjs）
├── public/                  # favicon.svg/ico · logo.svg · github.png · posts-index.json（构建产物，.prettierignore 忽略）· _headers（安全响应头/缓存）
├── next.config.ts           # NEXT_BUILD 双态切换的核心
├── eslint.config.mjs · .prettierrc · .prettierignore · tsconfig.json · postcss.config.mjs · .husky/pre-commit · .lintstagedrc
└── .github/workflows/deploy.yml  # CI：Node 24 + npm ci + npm run build + 部署 ./out 到 GitHub Pages（concurrency.group="pages"，串行不中断）
```

---

## 关键约定（非显然，必读）

### 1. `NEXT_BUILD=1` 双态切换 + basePath 注入

`next.config.ts` 中 `output: 'export'` / `basePath: '/sanshui-blog'` / `assetPrefix` **仅在 `NEXT_BUILD=1` 时生效**。

- `process.env.NEXT_BUILD` **没有** `NEXT_PUBLIC_` 前缀，Next.js 不会把它 inline 到客户端 bundle。
- 因此 `next.config.ts` 显式 `env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH }` 把 basePath 注入 `NEXT_PUBLIC_BASE_PATH`，Next.js 会 inline 到 SSR + 客户端 bundle 两边，`src/lib/basePath.ts` 读取此变量。
- **新增需要 basePath 的客户端代码时，必须走 `withBase()`，不要自己拼 `process.env.NEXT_BUILD`。**
- 原生 `<link>` / `<a>` / `<img>` **不走** Next `<Link>` / `next/image` 的 basePath 自动注入，必须用 `withBase()` 手动拼前缀（见 `src/app/page.tsx` 的预取 `<link rel="prefetch">`）。
- **不要手动设置 `output: 'export'`**：dev 模式下会导致 HMR 挂掉。

### 2. 异步 `params` / `searchParams`（Next 15+，16 同样适用）

动态路由页（`posts/[slug]`、`tags/[tag]`）的 `params` 是 `Promise`，必须 `const { slug } = await params;`。`generateMetadata` 同理。`generateStaticParams` 仍是同步。

### 3. 中文 slug 与 URL 编码

文件名可含中文（如 `深入理解-react-19-并发渲染机制.md`），slug = 文件名去后缀。

- `getPostBySlug()` 内部已 `decodeURIComponent(slug)`。
- 但 `generateStaticParams` 返回原始 slug（未编码），路由层拿到的 slug 仍可能是 URL 编码的，跨层传递时注意 decode。
- `getAdjacentPosts(slug)` 也对 slug 做 `decodeURIComponent`，调用时传原始 slug 即可。

### 4. `generateStaticParams` 必须返回所有 slug

纯静态导出依赖它预生成 HTML。新增文章后 `getAllPosts()` 会自动发现（基于 `fs.readdirSync`），**无需改代码**——但 `out/` 是构建产物，**必须重新运行 `npm run build`** 才会更新线上 HTML。dev 模式下 `predev` 会重新生成 `posts-index.json`，但文章页本身只在 build 时固化。

### 5. `'server-only'` 导入限制

`src/lib/posts.ts` / `toc.ts` / `types.ts` 顶部都有 `import 'server-only'`，这些 lib **只能在 RSC / Server Component 里调用**，不能 import 进 client 组件。客户端需要文章数据时 fetch `public/posts-index.json`（SearchModal 就是这么做的）。

### 6. TS 严格到索引访问

`noUncheckedIndexedAccess: true`：数组下标返回 `T | undefined`。访问 `arr[0]` 后必须判空或断言 `!`（代码中常见 `new Date(data.date).toISOString().split('T')[0]!`）。`noUnusedLocals` / `noUnusedParameters` 会把未用变量变 error，debug 时临时变量记得清理。

### 7. 静态导出的安全头走 `public/_headers`

`output: 'export'` 模式下，`next.config.ts` 的 `headers()` **不会生效**——静态 HTML 由 GitHub Pages 直接返回，不经过 Next。安全响应头（HSTS、X-Frame-Options、Permissions-Policy 等）通过仓库根的 `public/_headers` 配置，Next 静态导出会原样复制到 `out/_headers`，GitHub Pages 会识别。**新增响应头改 `public/_headers`，不要改 `next.config.ts`。** 同理 `public/_redirects`。

### 8. 构建期不执行 lint（Next 16 移除了 `--no-lint`）

Next 16 的 `next build` **不再执行 lint**（`--no-lint` 选项已移除），lint 完全独立于构建：CI/本地须单独跑 `npm run lint`。`eslint.config.mjs` 把 `@next/next/no-img-element` 降为 `warn`（静态导出场景 `<img>` 可接受），但优先用 `next/image`。

### 9. 图片：`images.unoptimized: true`

静态导出无服务端图像优化器，`next/image` 退化为原图直出，`formats: ['image/avif','image/webp']` 仅作为提示。新增图片需自行压缩。`public/` 下的资源引用要带 basePath：`<Image src={withBase('/logo.svg')} ... />`。

### 10. Tailwind v4 语法（无 `tailwind.config.js`）

- `globals.css` 用 `@import 'tailwindcss';` + `@plugin "@tailwindcss/typography";` + `@theme { ... }` 自定义设计令牌，而非 v3 的 `@tailwind` 指令。
- PostCSS 插件是 `@tailwindcss/postcss`（见 `postcss.config.mjs`）。
- 自定义颜色令牌：`--color-ink` / `--color-surface` / `--color-accent-violet` 等，用法 `bg-ink` / `text-accent-violet`。
- 自定义缓动：`--ease-out-expo` / `--ease-out-back` / `--ease-in-out-circ`。
- **不要新建 `tailwind.config.js`**，会与 v4 的 CSS-first 配置冲突。

### 11. 客户端动效组件懒加载

`AmbientEffects.tsx`（原 `Provider.tsx` 拆分出的动效注册表）用 `dynamic(() => import(...), { ssr: false })` 懒加载 `CursorGlow` / `ScrollProgress` / `ClickEffect` / `ParticleField`，避免打进首屏 chunk；并对 `prefers-reduced-motion` 用户跳过装饰性动效（**仅 `CursorGlow`** 受门控；`ClickEffect` 点击特效始终显示，不受门控影响，见约定 #11a）。新增仅客户端、非首屏必需的动效组件，在 `AmbientEffects` 加一行 `dynamic` 注册即可，照此模式。`experimental.optimizePackageImports: ['framer-motion','lucide-react','react-icons']` 让大库按需引入（Next 16 仍保留在该配置下）——**不要再自定义 `splitChunks`**，会与内置 chunk 策略冲突，反而拆出更多碎 chunk。

### 12. 亮色为主、暗色可选

默认 **亮色主题**。机制：`next-themes`（`attribute="class"`、`defaultTheme="system"`、`enableSystem`、`storageKey="aurora-theme"`）——未手动切换时跟随系统偏好。CSS 默认状态下 `<html>` 无 `.dark` 类，`globals.css` 用大量 `html:not(.dark) ...` 选择器把 body 渲染成亮色（背景 `#fafaf9`、文字 `#1c1917`、玻璃半透明白、shadow 偏淡）。暗色令牌定义在 `@theme` 与 `:root`（`--color-ink` 等），暗色模式下通过 `.dark` 类激活。`ThemeToggle` 调 `setTheme(isDark?'light':'dark')`。`layout.tsx` 的 `viewport` 同步声明亮色值（`colorScheme: 'light'`、`themeColor: '#fafaf9'`），保证浏览器 UA（滚动条/表单控件/地址栏）与默认主题一致。

**改暗色变量时同步检查 `html:not(.dark)` 亮色分支**，否则亮色会错乱。

### 13. 导航加载状态

`NavigationLoadingProvider`（`src/components/UI/NavigationLoading.tsx`）提供 `useNavigationLoading()` hook，返回 `{ startNavigation, done }`。`startNavigation` 延迟 300ms 显示全屏旋转加载覆盖层（快跳转根本看不到），`done` 隐藏。兜底 5 秒自动 clear。**只有跳转到文章详情页（`/posts/...`）的 `<Link>` 才调用 `startNavigation`**（`PostCard` 的卡片 Link、`PostNav` 的上/下篇 Link、`SearchModal` 的搜索结果 Link、`FeaturedPost` 的标题/阅读全文 Link；`PostPage` 挂载时 `done()`）。**导航、标签、归档、友链等其他入口一律不加**——非文章详情跳转出现 loading 覆盖层会严重影响体验。新增文章详情跳转时记得补 `onClick={startNavigation}`，漏加的跳转会看不到加载覆盖层，体感「卡死」。

### 14. 全局搜索（⌘K）

- 入口：`Navbar` 右上角 Search 按钮 + 全局 `⌘K` / `Ctrl+K` 快捷键。**快捷键监听在 `Navbar` 常驻注册**（⌘K/Ctrl+K → 打开面板）——此前监听被 SearchModal 的 `open` 门控导致快捷键失效，开关状态与快捷键必须收敛在同一模块；Esc / 外点关闭在 `SearchModal` 内由 `useDismiss` 处理（见约定 #28）。
- 数据：`SearchModal` 首次打开时 `fetch(withBase('/posts-index.json'))`，拉取轻量索引（~10KB，只含 slug/title/date/excerpt/tags，剔除正文）。**这是刻意设计**：避免全量文章数据被序列化进根 layout 的 RSC payload。
- 索引生成：`scripts/gen-posts-index.js` 在 `predev` / `prebuild` 时跑。
- 全文搜索另由 Pagefind 在 build 后扫描 `out/` 生成索引（与 ⌘K 是两套机制）。

### 15. MDX 渲染管线

`PostContent.tsx` 用 `next-mdx-remote/rsc`（服务端 MDX）+ `remark-gfm`（GFM 表格/任务列表）+ `rehype-slug`（标题锚点）+ `rehype-highlight`（代码高亮）。文章正文是 `gray-matter` 解析后的 `content` 字符串。**不要在文章 MDX 里用 React 组件**——`next-mdx-remote/rsc` 默认不注入自定义组件，要用需在 `MDXRemote` 的 `components` prop 显式传入。`CodeCopyInjector` 在客户端给代码块注入复制按钮。

### 16. 文章样式走 `.prose-article`，不是 Tailwind Typography

`PostContent` / `AboutContent` 用 `<div className="prose-article">` 包裹，文章排版样式全部在 `globals.css` 的 `.prose-article` 自定义（h1/h2/h3 字号颜色、`a` 紫粉渐变、`code` 紫底、`pre` 圆角边框、`blockquote` 紫边、`li::marker` 紫色等）。`@tailwindcss/typography` 插件虽 `@plugin` 引入，但**文章页未用 `prose` 类**——`prose-article` 是手写的，改文章样式就改 `.prose-article` 这一段 CSS。

### 17. TOC 只提取 h2/h3，锚点与渲染侧同源（github-slugger）

`src/lib/toc.ts` 的 `extractHeadings()` 逐行扫描，只把 `##`（h2）与 `###`（h3）放进目录，`#`（h1）和 `####`（h4）不进目录。**id 生成与渲染侧 rehype-slug 共用同一个 `github-slugger`**：先剥 HTML 标签再 `slug()`，h1~h6 全部推进 slugger 状态（重复标题得到 `-1/-2` 后缀），因此目录锚点与正文标题 id **严格一致**——中文/重音拉丁/日文假名都保留（`## 章节标题` → `id="章节标题"`、`## Résumé` → `id="résumé"`）。github-slugger v2 **不**折叠重复连字符、不去边缘连字符（`## A--B` → `id="a--b"`），这是与渲染侧一致的正确行为，**不要**再用旧正则去「修正」。行扫描还会跳过代码围栏（``` / ~~~）内的假标题，避免死锚点。**新增需要进目录的标题，必须用 `##` 或 `###`。**

TOC 组件（`src/components/Post/TableOfContents.tsx`）的实现约定：

- **桌面端**：目录 sticky 在正文**右边**（`page.tsx` 中正文在前、`TableOfContents` 在后，`lg:flex` 横排下视觉即右栏）。
- **移动端**：抽屉式目录在正文上方（`lg:hidden` 按钮 + 浮层），屏幕窄不摆 sticky 右栏。
- **高亮当前章节**：`IntersectionObserver` 监测视口上 30% 带（`rootMargin: '-80px 0px -70% 0px'`），回调里收集所有 intersecting entries 后按 `boundingClientRect.top` 排序取最靠上那个——解决「多标题同时进视口时高亮乱跳」与反向滚动判断。首屏默认高亮首项（`items[0]!.id`）。
- **点击跳转**：`e.preventDefault()` + `el.scrollIntoView({behavior:'smooth'})` 平滚；`history.replaceState(null,'','#id')` 写 URL hash（刷新/分享可还原位置）但不触发原生锚点跳转。
- **锚点不被 Navbar 遮挡**：`globals.css` 给 `.prose-article h2, .prose-article h3 { scroll-margin-top: 6rem; }`，TOC 点击 / URL hash 共用此缓冲。
- **淡入淡出滚动条**：`.toc-scroll` 藏原生滚动条（`scrollbar-width:none` + `::-webkit-scrollbar width:0`），浮一个 `.toc-thumb` 绝对定位指示条，按滚动比例算 `top`/`height`。显隐**只**由 hover 控制（`mouseenter` 显示 / `mouseleave` 隐藏），`opacity transition` 淡入淡出；浮层 `absolute` 不占文档流 → 不挤压文字布局。几何用 `ResizeObserver` + `requestAnimationFrame` 延迟算准布局，`document.fonts.ready` 兜底等字体加载后重算。
- **颜色联 Accent 主题**：用自定义 `.toc-link` / `.toc-link-active` 类（双前缀 `html.dark` / `html:not(.dark)` 提特异性到 (0,3,1)，见约定 #25），**不用** Tailwind utility `text-accent-violet`。`.toc-thumb` 也走 `rgb(var(--accent-violet-rgb) / α)`。

### 18. 文章解析契约在 `parse-post.mjs`，`posts.ts` 只是读取层

- **共享解析契约**：解析规则（文件名→slug、`title ?? slug`、date 规整、excerpt 兜底、`tags ?? []`）唯一实现在 `src/lib/parse-post.mjs`（纯 ESM、无 fs、无 `server-only`），`posts.ts` 与 `scripts/gen-posts-index.js` **共用**（脚本侧 `await import` 动态加载）。改解析规则只改这一处；SearchModal 的索引类型也由此结构派生。
- **单次装载（无 mtime 缓存）**：`getAllPosts()` 首次调用时读目录 → 解析 → 排序，模块级 memo 缓存为不可变数组，之后派生查询。**不要在运行时修改 `content/posts/` 下的文件**——内容只在装载时读一次，修改需重新 `build`（或 dev 重启）才生效。
- **slug 解码统一在模块边界**：`getPostBySlug` / `getAdjacentPosts` 内部经 `decodeSlug()` 做一次 `decodeURIComponent`，非法编码（如孤立 `%`）按原样查找、自然未命中，**不抛异常**——不存在「有的函数吞异常、有的裸抛」的分裂语义。
- **excerpt 兜底**：未写 `excerpt` 时取正文前 160 字并 `replace(/[#*`\[\]]/g,'')`去掉 markdown 符号。注意这个正则会**误删反引号围栏代码块的内容**，含代码开头的文章建议显式写`excerpt`。
- **日期格式**：`data.date` 被 `new Date(data.date).toISOString().split('T')[0]` 规整成 `YYYY-MM-DD`。frontmatter 里 `date` 写 `2026-01-01` 即可，时区差异由 `toISOString()` 处理。

### 19. 简历流式打印模块

`/about` 页内置终端式流式打印简历：

- 数据源 `content/resume.md`，构建期 `getResumeMarkdown()`（`src/lib/resume.ts`，含 `node:fs`，**客户端组件不能 import 它**）同步读取注入 `AboutContent` → `ResumeTerminal`。
- 行切分纯函数 `splitResumeLines` 在 `src/lib/resumeLines.ts`（无 fs、客户端安全），`ResumeTerminal` 直接引用。
- 动画触发：`IntersectionObserver`（`threshold: 0.2`，首次进入即启动并 disconnect）。
- 打印节奏：`setTimeout` 调度，空行 `0.4×`、标题行 `2.4×`、普通行 `1×`（默认 `lineDelay = 60ms`）。
- 自动滚动：每打印一行 `scrollTop = scrollHeight`，模拟终端追加。
- 双主题适配：`globals.css` 中 `.resume-terminal` 用 CSS 变量定义暗/亮两套配色，`html:not(.dark)` 覆盖亮色值。
- 支持的 Markdown 语法：`#/##/###` 标题、`- xxx` 列表、`> xxx` 引用、`---` 分隔线、`**粗体**`、`` `代码` ``。**不支持完整 Markdown**（如表格、图片），仅上述行内语法。
- 修改简历直接编辑 `content/resume.md`，无需改代码。

### 20. `reactStrictMode: true` 的副作用

开发模式下 effects 会执行两次（mount → unmount → mount）。`ResumeTerminal` 用 `startedRef` 守卫避免重复启动打印，`NavigationLoadingProvider` 用 `showTimerRef` / `fallbackRef` 守卫定时器，`SearchModal` 的延迟聚焦 `setTimeout` 用 `const t = setTimeout(...)` + `return () => clearTimeout(t)` 在 cleanup 中清。**新增带副作用的 client 组件时，务必做幂等清理**，否则 StrictMode 下会出现重复触发或定时器泄漏。

### 21. `trailingSlash: true`

所有路由以 `/` 结尾（如 `/posts/xxx/`）。`generateStaticParams` 与内部链接拼接都必须遵守，否则线上 404。Next `<Link>` 会自动处理，手拼 URL 时注意。

### 22. sharp / postcss overrides

`package.json` 的 `overrides` 锁定 `sharp: "^0.35.3"` 与 `postcss: "^8.5.25"`，保证静态导出 + `images.unoptimized: true` 场景下依赖树稳定。**升级这些包时要同步检查 overrides**，否则可能出现版本漂移导致构建失败。

### 23. Accent 主题强调色系统（运行时换色）

全站 6 个 accent 色（pink/violet/blue/teal/gold/rose）通过 CSS 变量 `--accent-*-rgb`（空格分隔 RGB 三元组，如 `168 85 247`）驱动，所有阴影、glow、hljs 高亮、prose-article 链接、resume-terminal、Aurora 文字渐变均经由 `rgb(var(--accent-xxx-rgb) / α)` 引用。**改 accent = 改这 6 个变量，全站联动。**

机制链路：

- `src/lib/accents.ts`：5 个预设调色板（Aurora/Emerald/Sunset/Ocean/Sakura）+ `CUSTOM_ACCENT_ID='custom'` + `getPreset()`/`resolveAccentColors()`/`applyAccent()`/`hexToRgb()`/`rgbToHex()`/`getCustomPreset()`/`saveCustomPreset()`，**防 FOUC 脚本 `accentBootstrapScript` 也由本模块生成**（与 `resolveAccentColors` 共享数据源）。storage key 为 `aurora-accent`（存当前激活预设 id），自定义预设 JSON 存 `aurora-accent-custom`。
- `src/components/UI/AccentPicker.tsx`：Navbar 上的 🎨 图标，Popover 上半列 5 个预设，下半「自定义」区有 6 个 `<input type="color">`，任一改变即生成 `custom` 预设 → `saveCustomPreset` + `applyAccent` + 写 `aurora-accent='custom'`。
- `src/app/layout.tsx`：`<head>` 内联 `accentBootstrapScript`（由 accents.ts 生成）防 FOUC，首屏前同步读 `aurora-accent`，若为 `custom` 再读 `aurora-accent-custom` JSON，写 6 个 `--accent-*-rgb` 到 `documentElement.style`。

约定：

- **新增需要 accent 色的 CSS**：用 `rgb(var(--accent-xxx-rgb) / α)`，**不要**写死 `rgba(168, 85, 247, ...)` 或 `#a855f7`，否则换色不联动。曾有的死紫色已清：`prose-article pre` 背景 `#0d0d1a`/`#0a0a16` → `var(--color-ink)` + accent 联动 border；`resume-terminal --rt-code-text: #c084fc` → `rgb(var(--accent-violet-rgb))`。
- **新增预设**：在 `ACCENT_PRESETS`（`src/lib/accents.ts`）追加一项即可——`accentBootstrapScript` 由本模块生成、已内联全部预设，**无需改 `layout.tsx`**。但脚本里 `presets` JSON 是构建期固化的，**新增预设后必须重新 build** 才能被防 FOUC script 识别。
- **改默认预设**：改 `DEFAULT_ACCENT_ID`，inline script 的 `def` 也会跟着走。
- **亮/暗主题与 accent 正交**：next-themes 管 `.dark` 类，AccentPicker 管 `--accent-*-rgb`，两者互不干扰。亮色 resume-terminal 原用更深紫（`#7c3aed`）提升对比度，现统一回主 accent 变量，亮模式下中等紫对比度略弱但行为一致。
- **`noUncheckedIndexedAccess` 注意**：`hexToRgb` 里 `m[1]` 需先判 `!m[1]` 再用，否则 TS 报 `possibly undefined`。

### 24. hover 变色不要走 Framer Motion，用纯 CSS

Framer Motion 的 `whileHover={{ color: 'rgb(var(--accent-violet-rgb))' }}` 会把动画后的 `color` 写成 **inline style**。CSS 变量在 inline style 中被解析成具体值（如 `rgb(168 85 247)`）后就**不再响应** `--accent-*-rgb` 的变化——切 Accent 主题色、切亮/暗模式时，标题会卡在动画那一刻的颜色上，看起来像「变白/变黑不响应主题」。

**正确做法**：hover 变色用纯 CSS（自定义类 + `:hover`），颜色完全交给 CSS 变量系统。PostCard 标题（`.post-card-title`）、「阅读」箭头（`.post-card-readmore` + `.post-card-link:hover`）就是这么改的。位移动画也一并迁到 CSS `transform`。

### 25. Tailwind v4 utility 的 layer 优先级坑

Tailwind v4 把 utility 类（`text-gray-500`、`group-hover/link:text-accent-violet` 等）注入到 `@layer utilities` 里。而 `globals.css` 中那些 `html:not(.dark) .text-gray-500 { color: #78716c }` 亮色覆盖规则是**裸 CSS**（不在任何 `@layer` 内）。**裸 CSS 优先级高于任何 `@layer` 内的同特异性规则**，所以亮色模式下 `group-hover/link:text-accent-violet` 这类 utility hover 会被裸覆盖规则持续压制，hover 不变色。

**正确做法**：需要响应 Accent 主题色联动的 hover 变色，**不要用 Tailwind utility**（`group-hover/link:text-accent-violet`），改用自定义 CSS 类（如 `.post-card-readmore`），用 `html.dark` / `html:not(.dark)` 双前缀提升特异性到 (0,3,1)，稳压裸覆盖规则。

### 26. globals.css 内同一元素的规则要集中，不要散乱

同一元素的暗色基与亮色覆盖（`html:not(.dark) ...`）必须写在相邻位置，避免「暗色基在文件头、亮色覆盖在文件尾」式的散乱——查样式要两头翻。**不写重复样式**：同一规则不得字面出现两次。

具体已集中的块：

- `::-webkit-scrollbar-thumb` / `.glass` / `.glass-heavy`：亮色覆盖并入 `@layer base` / `@layer utilities` 内暗色基旁。
- `.prose-article` 全系列（h1/h2/h3/p/a/code/pre/blockquote/table 等）：亮色覆盖并入 prose-article 块尾。
- Tailwind utility 亮色覆盖（`border-white/5` / `bg-white/5` / `text-gray-*` / `bg-surface` 等）：单独分组于文件尾，加「Tailwind utility 亮色覆盖」标题。

**新增元素的亮色覆盖**：紧贴其暗色基写，不要另起一处散到文件尾。

### 27. 含点号标签（如 `Next.js`）的 RSC payload 路径坑

Next `<Link>` 对含 `.` 的路径段（如 `/tags/Next.js/`）按「文件路径」处理，**渲染时会剥离尾斜杠**（`/tags/Next.js/` → `/tags/Next.js`），其他标签（如 `/tags/前端/`）不受影响。这导致客户端软导航请求 RSC payload 走 `/tags/Next.js.txt`，而静态导出实际生成在 `/tags/Next.js/index.txt` → 线上 404（页面能打开，但控制台报错、软导航降级）。

**修复**：`scripts/gen-dotted-tag-payloads.js` 在 build 流水线末尾（`pagefind` 之后）扫描 `out/tags/`，把含点号目录的 `index.txt` 复制为 `<名字>.txt`，补齐客户端实际请求的路径。**新增含点号标签后无需改代码**——脚本自动处理；但必须重新 `npm run build` 才生效。

### 28. 弹层关闭统一走 `useDismiss`

`src/components/UI/useDismiss.ts` 收口「点击外部 / Esc 关闭」：外点用 mousedown 判定 + `setTimeout(0)` 延迟绑定（避开「触发弹层打开的同一次点击」这个坑）+ cleanup 解绑。**ref 必须包裹「开关按钮 + 浮层」**，否则点击开关会被误判为外点，与按钮 `onClick` 形成开关竞态。已用于 AccentPicker / FilterDropdown / SearchModal；**Navbar 移动菜单**用 `{ outside: false }` 只启用 Esc（开关按钮在 header、浮层外，mousedown 外点判定会误关），外点关闭继续由遮罩 `onClick` 负责。**新增弹层组件时直接用 `useDismiss`，不要手写第四份监听。**

### 29. `posts-index.json` 是构建产物，已被 `.prettierignore` 忽略

`public/posts-index.json` 由 `scripts/gen-posts-index.js` 用 `JSON.stringify` 生成（紧凑格式，与 Prettier 风格不一致），已在 `.prettierignore` 忽略——`format:check` / lint-staged 都会跳过它。**不要**手动格式化它，也不要把它从 `.prettierignore` 移除；改索引字段改 `parse-post.mjs` 或脚本的字段选取。

### 30. Turbopack 无法解析 Tailwind v4.3 的生成 CSS，dev/build 用 `--webpack`

Next 16 默认用 Turbopack（内置 lightningcss 解析器）构建，会对 Tailwind v4.3 生成的 `@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) ...}` 报 **`Invalid dangling combinator in selector`**（Turbopack 解析器缺陷，非本站 CSS 问题）。因此 dev / build 脚本都显式加 `--webpack`（与 Next 15 时代的 webpack 管线一致，静态导出行为不变）。**不要**移除该 flag，也不要改 globals.css 去规避；升级 Tailwind 或等待 Turbopack 修复后再评估移除。

**跟进指引**：问题在 Turbopack 的 CSS 解析路径（已实测独立 lightningcss 能解析相同 CSS，故无法靠升级 Tailwind/postcss 解决，且各依赖均已是最新版）。唯一解法在上游——每次升级 Next 补丁版后，本地跑 `NEXT_BUILD=1 npx next build`（不带 `--webpack`）验证：能通过即从 dev/build 脚本移除 `--webpack` 并删除本条规避说明。

---

## 内容编辑约定

- 新文章放 `content/posts/`，扩展名 `.md` 或 `.mdx`。文件名即 slug，建议中文+连字符命名以保持 URL 可读性。
- Frontmatter：

  | 字段      | 类型     | 必填 | 说明                                                    |
  | --------- | -------- | ---- | ------------------------------------------------------- |
  | `title`   | string   | ✅   | 文章标题                                                |
  | `date`    | string   | ✅   | `YYYY-MM-DD`，用于排序                                  |
  | `tags`    | string[] | ❌   | 标签列表，驱动 `/tags` 页                               |
  | `excerpt` | string   | ❌   | 摘要；不写则取正文前 160 字（含代码块的文章建议显式写） |

- 正文用标准 Markdown / GFM。目录自动从 `##` / `###` 提取。代码块自动高亮（rehype-highlight）+ 复制按钮（CodeCopyInjector）。
- **新增/修改文章后**：`predev` / `prebuild` 钩子会自动重新生成 `public/posts-index.json`，SearchModal 即可搜索到新文章。但**线上 HTML 只在重新 build 后更新**。

---

## 排查路由 / 结构时以 `src/app/` 为准

`out/` 是 `npm run build` 的静态导出产物，在 `.gitignore` 中、未被 git 跟踪。排查路由时以 `src/app/` 为准，不要把 `out/` 的旧产物当成当前结构，也不要手动清理 `out/`——下次 `build` 会整体覆盖。

---

## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues, operated via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage labels, each equal to its role name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
