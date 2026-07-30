# AGENTS.md — sanshui-blog

三水的个人博客。Next.js 15.5（App Router，纯静态导出 `output: 'export'`）+ TypeScript 5 strict + Tailwind CSS v4 + Framer Motion 12。托管在 GitHub Pages，basePath 为 `/sanshui-blog`，部署走 `.github/workflows/deploy.yml` 自动 CI/CD。全站暗色「Aurora 玻璃态」设计系统。

---

## 命令

| 用途     | 命令                                      | 备注                                                                                                                                                                                                                                              |
| -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 开发     | `npm run dev`                             | `predev` 先跑 `scripts/predev.js`（生成 ConsoleNinja 兼容的 `.next/routes-manifest.json`）+ `scripts/gen-posts-index.js`（生成 `public/posts-index.json`）。开发模式 **不设** `NEXT_BUILD`，因此无 `basePath` / `assetPrefix` / `output:export`。 |
| 生产构建 | `npm run build`                           | `prebuild` 重新生成 `posts-index.json` → `cross-env NEXT_BUILD=1 next build --no-lint`（静态导出到 `out/`）→ `pagefind --site out`（生成全文搜索索引）。                                                                                          |
| Lint     | `npm run lint` / `npm run lint:fix`       | ESLint v9 flat config（`eslint.config.mjs`，通过 `FlatCompat` 继承 `next/core-web-vitals` + `next/typescript`）。构建脚本带 `--no-lint`，CI/本地须单独跑。                                                                                        |
| 格式化   | `npm run format` / `npm run format:check` | Prettier：2 空格、单引号、`printWidth: 100`、`trailingComma: "all"`、`endOfLine: "lf"`（见 `.prettierrc`）。                                                                                                                                      |
| 预览产物 | `npx serve out`                           | 本地起 HTTP 服务器看构建结果。                                                                                                                                                                                                                    |
| 类型检查 | `npx tsc --noEmit`                        | `tsconfig.json` 开 `strict` + `noUncheckedIndexedAccess` + `noUnusedLocals` + `noUnusedParameters` + `noImplicitOverride`。                                                                                                                       |

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
│   │   ├── layout.tsx       # 根布局：字体、Provider、metadata、viewport
│   │   ├── page.tsx         # 首页：Hero + Stats + Featured + 文章网格 + 预取 <link>
│   │   ├── globals.css      # Tailwind v4 @theme 设计令牌 + 各模块样式
│   │   ├── fonts.ts         # Inter (sans) + JetBrains Mono (mono)，next/font
│   │   ├── loading.tsx      # 全局骨架屏
│   │   ├── not-found.tsx    # 404（粒子动画）
│   │   ├── about/           # 关于页（简历流式打印）
│   │   ├── archive/         # 归档（按年份分组）
│   │   ├── tags/[tag]/      # 标签云 + 按标签筛选
│   │   ├── posts/[slug]/    # 文章详情：generateStaticParams + generateMetadata
│   │   └── links/           # 友链
│   ├── components/
│   │   ├── Layout/          # Navbar · Footer · ScrollProgress
│   │   ├── Home/            # HeroScene · StatsGrid · FeaturedPost
│   │   ├── Post/            # PostCard · PostContent · PostMeta · PostNav · PostDone · TableOfContents · CodeCopyInjector
│   │   ├── About/           # AboutContent · ResumeTerminal
│   │   ├── Links/ · NotFound/
│   │   ├── UI/              # CursorGlow · ClickEffect · GithubIcon · SearchModal · ThemeToggle · NavigationLoading
│   │   ├── Provider.tsx     # 客户端 Provider：next-themes + 导航加载 + 懒加载动效组件
│   │   └── TagList.tsx
│   ├── lib/
│   │   ├── types.ts         # Post 接口（'server-only'）
│   │   ├── posts.ts         # getAllPosts/getPostBySlug/getAllTags/getPostsByTag/getAdjacentPosts（mtime 签名缓存）
│   │   ├── toc.ts           # extractHeadings：只提取 ## / ###，id 保留中文
│   │   ├── resume.ts        # getResumeMarkdown：构建期同步读取 content/resume.md
│   │   └── basePath.ts      # BASE_PATH + withBase()
│   └── global.d.ts
├── scripts/
│   ├── predev.js            # ConsoleNinja 兼容：生成 .next/routes-manifest.json
│   └── gen-posts-index.js   # 生成 public/posts-index.json（SearchModal 运行时 fetch）
├── public/                  # favicon.svg/ico · logo.svg · github.png · posts-index.json · _headers（安全响应头/缓存）
├── next.config.ts           # NEXT_BUILD 双态切换的核心
├── eslint.config.mjs · .prettierrc · tsconfig.json · postcss.config.mjs
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

### 2. Next 15 异步 `params` / `searchParams`

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

### 8. 构建期 lint 跳过

`build` 脚本用 `next build --no-lint`，lint 失败不会阻断 build。CI/本地须单独跑 `npm run lint`。`eslint.config.mjs` 把 `@next/next/no-img-element` 降为 `warn`（静态导出场景 `<img>` 可接受），但优先用 `next/image`。

### 9. 图片：`images.unoptimized: true`

静态导出无服务端图像优化器，`next/image` 退化为原图直出，`formats: ['image/avif','image/webp']` 仅作为提示。新增图片需自行压缩。`public/` 下的资源引用要带 basePath：`<Image src={withBase('/logo.svg')} ... />`。

### 10. Tailwind v4 语法（无 `tailwind.config.js`）

- `globals.css` 用 `@import 'tailwindcss';` + `@plugin "@tailwindcss/typography";` + `@theme { ... }` 自定义设计令牌，而非 v3 的 `@tailwind` 指令。
- PostCSS 插件是 `@tailwindcss/postcss`（见 `postcss.config.mjs`）。
- 自定义颜色令牌：`--color-ink` / `--color-surface` / `--color-accent-violet` 等，用法 `bg-ink` / `text-accent-violet`。
- 自定义缓动：`--ease-out-expo` / `--ease-out-back` / `--ease-in-out-circ`。
- **不要新建 `tailwind.config.js`**，会与 v4 的 CSS-first 配置冲突。

### 11. 客户端动效组件懒加载

`Provider.tsx` 用 `dynamic(() => import(...), { ssr: false })` 懒加载 `CursorGlow` / `ScrollProgress` / `ClickEffect`，避免打进首屏 chunk。新增仅客户端、非首屏必需的动效组件，照此模式。`experimental.optimizePackageImports: ['framer-motion','lucide-react','react-icons']` 让大库按需引入——**不要再自定义 `splitChunks`**，会与 Next 15 SWC 内置 chunk 策略冲突，反而拆出更多碎 chunk。

### 11b. 亮色为主、暗色可选

默认 **亮色主题**。机制：`next-themes`（`attribute="class"`、`defaultTheme="system"`、`enableSystem`、`storageKey="aurora-theme"`）——未手动切换时跟随系统偏好。CSS 默认状态下 `<html>` 无 `.dark` 类，`globals.css` 用大量 `html:not(.dark) ...` 选择器把 body 渲染成亮色（背景 `#fafaf9`、文字 `#1c1917`、玻璃半透明白、shadow 偏淡）。暗色令牌定义在 `@theme` 与 `:root`（`--color-ink` 等），暗色模式下通过 `.dark` 类激活。`ThemeToggle` 调 `setTheme(isDark?'light':'dark')`。`layout.tsx` 的 `viewport` 同步声明亮色值（`colorScheme: 'light'`、`themeColor: '#fafaf9'`），保证浏览器 UA（滚动条/表单控件/地址栏）与默认主题一致。

**改暗色变量时同步检查 `html:not(.dark)` 亮色分支**，否则亮色会错乱。

### 12. 导航加载状态

`NavigationLoadingProvider`（`src/components/UI/NavigationLoading.tsx`）提供 `useNavigationLoading()` hook，返回 `{ startNavigation, done }`。`startNavigation` 延迟 300ms 显示全屏旋转加载覆盖层（快跳转根本看不到），`done` 隐藏。兜底 5 秒自动 clear。所有触发路由跳转的 `<Link>` 应调用 `startNavigation` 触发加载指示器（PostPage 挂载时 `done()`）。

### 13. 全局搜索（⌘K）

- 入口：`Navbar` 右上角 Search 按钮 + 全局 `⌘K` / `Ctrl+K` 快捷键。
- 数据：`SearchModal` 首次打开时 `fetch(withBase('/posts-index.json'))`，拉取轻量索引（~10KB，只含 slug/title/date/excerpt/tags，剔除正文）。**这是刻意设计**：避免全量文章数据被序列化进根 layout 的 RSC payload。
- 索引生成：`scripts/gen-posts-index.js` 在 `predev` / `prebuild` 时跑。
- 全文搜索另由 Pagefind 在 build 后扫描 `out/` 生成索引（与 ⌘K 是两套机制）。

### 14. MDX 渲染管线

`PostContent.tsx` 用 `next-mdx-remote/rsc`（服务端 MDX）+ `remark-gfm`（GFM 表格/任务列表）+ `rehype-slug`（标题锚点）+ `rehype-highlight`（代码高亮）。文章正文是 `gray-matter` 解析后的 `content` 字符串。**不要在文章 MDX 里用 React 组件**——`next-mdx-remote/rsc` 默认不注入自定义组件，要用需在 `MDXRemote` 的 `components` prop 显式传入。`CodeCopyInjector` 在客户端给代码块注入复制按钮。

### 14b. 文章样式走 `.prose-article`，不是 Tailwind Typography

`PostContent` / `AboutContent` 用 `<div className="prose-article">` 包裹，文章排版样式全部在 `globals.css` 的 `.prose-article` 自定义（h1/h2/h3 字号颜色、`a` 紫粉渐变、`code` 紫底、`pre` 圆角边框、`blockquote` 紫边、`li::marker` 紫色等）。`@tailwindcss/typography` 插件虽 `@plugin` 引入，但**文章页未用 `prose` 类**——`prose-article` 是手写的，改文章样式就改 `.prose-article` 这一段 CSS。

### 15. TOC 只提取 h2/h3，锚点保留中文

`src/lib/toc.ts` 的 `extractHeadings()` 只匹配 `^#{2,3}\s+`（即 `##` 和 `###`），`#`（h1）和 `####`（h4）不会进目录。生成的 `id` 用正则 `[\w\u4e00-\u9fff\s-]` 过滤，**保留中文字符**，所以中文标题会得到中文锚点（如 `## 章节标题` → `id="章节标题"`）。rehype-slug 在 MDX 渲染侧也会生成 id，两边规则需保持一致。**新增需要进目录的标题，必须用 `##` 或 `###`。**

### 16. `posts.ts` 读取层契约

- **mtime 签名缓存**：`getAllPosts()` 用 `computeSignature()`（文件名 + `mtimeMs` 拼接）做缓存键，文件未改动时直接返回内存缓存。**不要在运行时修改 `content/posts/` 下的文件**——签名会变但 SSG 已固化，只能通过重新 `build` 生效。
- **excerpt 兜底**：未写 `excerpt` 时取正文前 160 字并 `replace(/[#*`\[\]]/g,'')`去掉 markdown 符号。注意这个正则会**误删反引号围栏代码块的内容**，含代码开头的文章建议显式写`excerpt`。
- **日期格式**：`data.date` 被 `new Date(data.date).toISOString().split('T')[0]` 规整成 `YYYY-MM-DD`。frontmatter 里 `date` 写 `2026-01-01` 即可，时区差异由 `toISOString()` 处理。

### 17. 简历流式打印模块

`/about` 页内置终端式流式打印简历：

- 数据源 `content/resume.md`，构建期 `getResumeMarkdown()` 同步读取注入 `AboutContent` → `ResumeTerminal`。
- 动画触发：`IntersectionObserver`（`threshold: 0.2`，首次进入即启动并 disconnect）。
- 打印节奏：`setTimeout` 调度，空行 `0.4×`、标题行 `2.4×`、普通行 `1×`（默认 `lineDelay = 60ms`）。
- 自动滚动：每打印一行 `scrollTop = scrollHeight`，模拟终端追加。
- 双主题适配：`globals.css` 中 `.resume-terminal` 用 CSS 变量定义暗/亮两套配色，`html:not(.dark)` 覆盖亮色值。
- 支持的 Markdown 语法：`#/##/###` 标题、`- xxx` 列表、`> xxx` 引用、`---` 分隔线、`**粗体**`、`` `代码` ``。**不支持完整 Markdown**（如表格、图片），仅上述行内语法。
- 修改简历直接编辑 `content/resume.md`，无需改代码。

### 18. `reactStrictMode: true` 的副作用

开发模式下 effects 会执行两次（mount → unmount → mount）。`ResumeTerminal` 用 `startedRef` 守卫避免重复启动打印，`NavigationLoadingProvider` 用 `showTimerRef` / `fallbackRef` 守卫定时器。**新增带副作用的 client 组件时，务必做幂等清理**，否则 StrictMode 下会出现重复触发或定时器泄漏。

### 19. `trailingSlash: true`

所有路由以 `/` 结尾（如 `/posts/xxx/`）。`generateStaticParams` 与内部链接拼接都必须遵守，否则线上 404。Next `<Link>` 会自动处理，手拼 URL 时注意。

### 20. sharp / postcss overrides

`package.json` 的 `overrides` 锁定 `sharp: "^0.35.3"` 与 `postcss: "^8.5.20"`，保证静态导出 + `images.unoptimized: true` 场景下依赖树稳定。**升级这些包时要同步检查 overrides**，否则可能出现版本漂移导致构建失败。

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
