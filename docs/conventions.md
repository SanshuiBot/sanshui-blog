# 关键约定详解

本文件是 AGENTS.md「关键约定清单」的展开版。清单只给红线，这里给机制、实现路径、公式与历史坑。需要深挖某条约定时再读本文件，不必常驻上下文。

---

## 1. `NEXT_BUILD=1` 双态切换 + basePath 注入

`output: 'export'` / `basePath` / `assetPrefix` **仅在 `NEXT_BUILD=1` 时生效**。`process.env.NEXT_BUILD` 没有 `NEXT_PUBLIC_` 前缀，不会被 inline 到客户端 bundle；`next.config.ts` 显式 `env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH }` 注入，`src/lib/basePath.ts` 读取。

- **新增需要 basePath 的客户端代码，必须走 `withBase()`**，不要自己拼 `process.env.NEXT_BUILD`。
- **不要手动设置 `output: 'export'`**：dev 模式下会导致 HMR 挂掉。

### basePath 注入矩阵（实测产物验证过）

不同目标对 basePath 的处理不一样，**套错 `withBase()` 会双重前缀**（线上 404）。判定基准：`npm run build` 后检查 `out/*.html` 里的实际 URL（曾两次栽在这里）：

| 目标                                             | 是否自动注入 basePath                   | 写法                                                                                       |
| ------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `<Link>`（next/link）                            | ✅ 自动（**只用于真实路由**）           | `href="/archive/"`（别套 withBase；静态文件如 feed.xml 会做 RSC 预取 404，改用原生 `<a>`） |
| `router.push` / `router.prefetch`                | ✅ 自动                                 | 裸路径（PostCard 的 `postUrl()` 就这么用）                                                 |
| `<Image>`（next/image）                          | ❌ 不自动（实测）                       | `src={withBase('/logo.svg')}`（**必须套**，server/client 同）                              |
| metadata 图片（og:image 等相对 URL）             | ❌ 不自动；`metadataBase` 已含 basePath | `url: '/og.png'`（**裸相对路径**，套了双重）                                               |
| metadata `icons`（favicon）                      | ❌ 不自动（原生输出）                   | `withBase('/favicon.svg')`（必须套）                                                       |
| 原生 `<a>` / `<img>` / `<link>` / `<script src>` | ❌ 不自动                               | 必须 withBase（首页 `<link rel="prefetch">` 如此）                                         |
| `fetch()` / XHR                                  | ❌ 不自动                               | 必须 withBase（SearchModal / PostsList / HeroParallax 拉索引如此）                         |

**历史 bug（三次：栽在「以为自动注入」「以为不自动注入」「Link 当路由」）**：

1. Footer RSS 链接：`<Link href={withBase('/feed.xml')}>` → 产物 `href="/sanshui-blog/sanshui-blog/feed.xml"`——`<Link>` 自动注入 + 手写 withBase 双重前缀，线上订阅链接 404。已修为裸路径。
2. `layout.tsx` 的 og:image：`withBase('/og.png')` → 产物 `https://.../sanshui-blog/sanshui-blog/og.png`——metadataBase 已是 `siteConfig.url`（含 basePath），相对路径再被解析叠加。已修为裸路径 `/og.png`。
3. Footer RSS 链接（第二弹）：`<Link href="/feed.xml">` 虽无双重前缀，但 feed.xml 是**静态文件不是路由**——`<Link>` 把它当页面做 RSC 预取（请求 `/feed.xml/__next._tree.txt`、`feed.xml.txt?_rsc=`）→ 线上控制台 404 噪音。已改原生 `<a href={withBase('/feed.xml')}>` + `target="_blank"`。**判定**：`<Link>` 只用于真实路由（src/app/ 下有对应页面），静态资源一律原生 `<a>`。

**判定方法**：改完任何带 URL 的代码后 `npm run build`，`grep -o 'sanshui-blog/sanshui-blog' out/*.html` 应为空。

## 2. 异步 `params` / `searchParams`（Next 15+，16 同样适用）

动态路由页（`posts/[slug]`、`tags/[tag]`）的 `params` 是 `Promise`，必须 `const { slug } = await params;`。`generateMetadata` 同理。`generateStaticParams` 仍是同步。

## 3. 中文 slug 与 URL 编码

文件名可含中文（如 `深入理解-react-19-并发渲染机制.md`），slug = 文件名去后缀。`getPostBySlug()` 内部已 `decodeURIComponent(slug)`；`generateStaticParams` 返回原始 slug（未编码），路由层拿到的 slug 仍可能是 URL 编码的，跨层传递时注意 decode。`getAdjacentPosts(slug)` 也对 slug 做 `decodeURIComponent`，调用时传原始 slug 即可。

## 4. `generateStaticParams` 必须返回所有 slug

纯静态导出依赖它预生成 HTML。新增文章后 `getAllPosts()` 会自动发现（基于 `fs.readdirSync`），**无需改代码**——但 `out/` 是构建产物，**必须重新运行 `npm run build`** 才会更新线上 HTML。dev 模式下 `predev` 会重新生成 `posts-index.json`，但文章页本身只在 build 时固化。

## 5. `'server-only'` 导入限制

`src/lib/posts.ts` / `toc.ts` / `types.ts` 顶部都有 `import 'server-only'`，这些 lib **只能在 RSC / Server Component 里调用**，不能 import 进 client 组件。客户端需要文章数据时 fetch `public/posts-index.json`（SearchModal 就是这么做的）。

## 6. TS 严格到索引访问

`noUncheckedIndexedAccess: true`：数组下标返回 `T | undefined`。访问 `arr[0]` 后必须判空或断言 `!`（代码中常见 `new Date(data.date).toISOString().split('T')[0]!`）。`noUnusedLocals` / `noUnusedParameters` 会把未用变量变 error，debug 时临时变量记得清理。

## 7. 静态导出的安全头走 `public/_headers`

`output: 'export'` 模式下，`next.config.ts` 的 `headers()` **不会生效**——静态 HTML 由 GitHub Pages 直接返回，不经过 Next。安全响应头（HSTS、X-Frame-Options、Permissions-Policy 等）通过仓库根的 `public/_headers` 配置，Next 静态导出会原样复制到 `out/_headers`，GitHub Pages 会识别。**新增响应头改 `public/_headers`，不要改 `next.config.ts`。** 同理 `public/_redirects`。

## 8. 构建期不执行 lint（Next 16 移除了 `--no-lint`）

Next 16 的 `next build` **不再执行 lint**，lint 完全独立于构建：CI/本地须单独跑 `npm run lint`。`eslint.config.mjs` 把 `@next/next/no-img-element` 降为 `warn`（静态导出场景 `<img>` 可接受），但优先用 `next/image`。

## 9. 图片：`images.unoptimized: true`

静态导出无服务端图像优化器，`next/image` 退化为原图直出。新增图片需自行压缩。`public/` 下的资源引用：Server Component 的 `<Image>` 由 Next 自动注入 basePath，无需 `withBase()`；客户端组件（`'use client'`）需手动包裹 `withBase()`，如 `<Image src={withBase('/logo.svg')} ... />`。Navbar 的 logo 是 Server Component，直接写 `src="/logo.svg"` 即可。

## 10. Tailwind v4 语法（无 `tailwind.config.js`）

- `globals.css` 用 `@import 'tailwindcss';` + `@plugin "@tailwindcss/typography";` + `@theme { ... }`，而非 v3 的 `@tailwind` 指令。
- PostCSS 插件是 `@tailwindcss/postcss`（见 `postcss.config.mjs`）。
- 自定义颜色令牌：`--color-ink` / `--color-surface` / `--color-accent-violet` 等，用法 `bg-ink` / `text-accent-violet`。
- 自定义缓动：`--ease-out-expo` / `--ease-out-back` / `--ease-in-out-circ`。
- **不要新建 `tailwind.config.js`**，会与 v4 的 CSS-first 配置冲突。

## 11. 客户端动效组件懒加载

`AmbientEffects.tsx` 用 `dynamic(() => import(...), { ssr: false })` 懒加载 `CursorGlow` / `ScrollProgress` / `ClickEffect` / `ParticleField`，避免打进首屏 chunk；并对 `prefers-reduced-motion` 用户跳过装饰性动效（`CursorGlow`、`ClickEffect` 均受门控；`ScrollProgress` 功能性指示条保留但 spring 平滑入阀；`ParticleField` 内部自检画静态帧）。新增仅客户端、非首屏必需的动效组件，在 `AmbientEffects` 加一行 `dynamic` 注册即可。`experimental.optimizePackageImports: ['framer-motion','lucide-react']` 让大库按需引入——**不要再自定义 `splitChunks`**，会与内置 chunk 策略冲突。

**装饰性 JS 动效实例化开销**：`PostCard` 的 spotlight + 3D tilt 效果收口在 `src/components/Post/CardSpotlight.tsx`——作为无渲染辅助组件，仅在卡片非骨架时挂载（`!skeleton`），骨架槽位不创建 MotionValue/Spring 实例。挂载后通过 `onRefs` 回调向父组件暴露 MotionValue，父组件用 state 存储并在渲染期读取（绕开 ref 在渲染期的访问警告）。**约定 #21**：effect cleanup 必须调用 `onRefs(null)`，使 StrictMode 双执行下第二次 mount 可安全覆盖首次创建的实例，且 MotionValue 可被 GC。

## 12. 亮色为主、暗色可选

默认 **亮色主题**。机制：`next-themes`（`attribute="class"`、`defaultTheme="system"`、`enableSystem`、`storageKey="aurora-theme"`）——未手动切换时跟随系统偏好。CSS 默认状态下 `<html>` 无 `.dark` 类，`globals.css` 用大量 `html:not(.dark) ...` 选择器把 body 渲染成亮色（背景 `#fafaf9`、文字 `#1c1917`、玻璃半透明白、shadow 偏淡）。暗色令牌定义在 `@theme` 与 `:root`（`--color-ink` 等），暗色模式下通过 `.dark` 类激活。`ThemeToggle` 调 `setTheme(isDark?'light':'dark')`。`layout.tsx` 的 `viewport` 同步声明亮色值（`colorScheme: 'light'`、`themeColor: '#fafaf9'`），保证浏览器 UA 与默认主题一致。

**改暗色变量时同步检查 `html:not(.dark)` 亮色分支**，否则亮色会错乱。

## 13. 导航加载状态

`NavigationLoadingProvider`（`src/components/UI/NavigationLoading.tsx`）提供 `useNavigationLoading()` hook，返回 `{ startNavigation, done }`。`startNavigation` 延迟 300ms 显示全屏旋转加载覆盖层（快跳转根本看不到），`done` 隐藏。兜底 5 秒自动 clear。

**只有跳转到文章详情页（`/posts/...`）的 `<Link>` 才调用 `startNavigation`**：

- 入口（4 处）：`PostCard` 的卡片 Link、`PostNav` 的上/下篇 Link、`SearchModal` 的搜索结果 Link、`FeaturedPost` 的标题/阅读全文 Link——新增时记得补 `onClick={startNavigation}`，漏加的跳转会看不到加载覆盖层，体感「卡住」。
- 出口：`src/app/posts/[slug]/page.tsx` 挂载时调用 `done()` 隐藏覆盖层——新增详情页路由时勿漏，否则 loading 会卡住不消失。

**导航、标签、归档、友链等其他入口一律不加**——非文章详情跳转出现 loading 覆盖层会严重影响体验。

## 14. 全局搜索（⌘K）

- 入口：`Navbar` 右上角 Search 按钮 + 全局 `⌘K` / `Ctrl+K` 快捷键。**快捷键监听在 `Navbar` 常驻注册**；Esc / 外点关闭在 `SearchModal` 内由 `useDismiss` 处理（约定 #29）。
- 数据：`SearchModal` 首次打开时 `fetch(withBase('/posts-index.json'))`，拉取轻量索引（~10KB，只含 slug/title/date/excerpt/tags，剔除正文）。**这是刻意设计**：避免全量文章数据被序列化进根 layout 的 RSC payload。
- 索引生成：`scripts/gen-posts-index.js` 在 `predev` / `prebuild` 时跑。

## 15. 文章卡片网格「跟手」流式渲染

`PostGrid` + `PostCard` 实现「跟手」流式渐进渲染：骨架渐隐与卡片渐显是**同一 DOM 帧的叠加**，零空白帧。挂载后从第 0 张起每张间隔 80ms 把骨架替换成真实卡片。

关键实现：

- **骨架层与卡片层同时挂载于同一容器**，absolute 叠放，只通过 opacity 切换显隐——零空白帧
- **容器用固定 `h-60`（240px）**——所有卡片共享同一高度，不参差不齐
- **槽位 key 用 `slot-${i}` 稳定不变**——骨架→卡片切换不触发 DOM 卸载/重挂
- **卡片入场动画用 `animate`（挂载即播放）**——列表场景卡片总是从下方进入视野，等 `IntersectionObserver` 反而不跟手
- **两层用完全相同的 transition**（`duration: 0.25s`）——骨架快速被卡片覆盖；不用 `y` 位移，位移会让卡片在途中「露半张」
- **`prefetchedRef` 在 `post.slug` 变化时重置**——稳定 slot key 复用 PostCard 实例时，避免新文章 hover 跳过 prefetch

骨架模式：`skeleton === true` 时只渲染骨架层（卡片内容不挂载，避免空 post 撑高度）；`skeleton` 切到 false 时用 `AnimatePresence` 让骨架层淡出、卡片层淡入。

## 16. MDX 渲染管线

`PostContent.tsx` 用 `next-mdx-remote/rsc`（服务端 MDX）+ `remark-gfm`（GFM 表格/任务列表）+ `rehype-slug`（标题锚点）+ `rehype-highlight`（代码高亮）。文章正文是 `gray-matter` 解析后的 `content` 字符串。**不要在文章 MDX 里用 React 组件**——`next-mdx-remote/rsc` 默认不注入自定义组件，要用需在 `MDXRemote` 的 `components` prop 显式传入。`CodeCopyInjector` 在客户端给代码块注入复制按钮。

## 17. 文章样式走 `.prose-article`，不是 Tailwind Typography

`PostContent` / `AboutContent` 用 `<div className="prose-article">` 包裹，文章排版样式全部在 `globals.css` 的 `.prose-article` 自定义（h1/h2/h3 字号颜色、`a` 紫粉渐变、`code` 紫底、`pre` 圆角边框、`blockquote` 紫边、`li::marker` 紫色等）。`@tailwindcss/typography` 插件虽 `@plugin` 引入，但**文章页未用 `prose` 类**——`prose-article` 是手写的，改文章样式就改 `.prose-article` 这一段 CSS。

## 18. TOC 只提取 h2/h3，锚点与渲染侧同源（github-slugger）

`src/lib/toc.ts` 的 `extractHeadings()` 逐行扫描，只把 `##`（h2）与 `###`（h3）放进目录，`#`（h1）和 `####`（h4）不进目录。**id 生成与渲染侧 rehype-slug 共用同一个 `github-slugger`**：先剥 HTML 标签再 `slug()`，h1~h6 全部推进 slugger 状态（重复标题得到 `-1/-2` 后缀），因此目录锚点与正文标题 id **严格一致**——中文/重音拉丁/日文假名都保留（`## 章节标题` → `id="章节标题"`、`## Résumé` → `id="résumé"`）。github-slugger v2 **不**折叠重复连字符、不去边缘连字符（`## A--B` → `id="a--b"`），这是与渲染侧一致的正确行为，**不要**再用旧正则去「修正」。行扫描还会跳过代码围栏（``` / ~~~）内的假标题，避免失效锚点。**新增需要进目录的标题，必须用 `##` 或 `###`。**

TOC 组件（`src/components/Post/TableOfContents.tsx`）的实现约定：

- **桌面端**：目录 sticky 在正文**右边**；**移动端**：抽屉式目录在正文上方（`lg:hidden`）。
- **高亮当前章节**：`IntersectionObserver`（`rootMargin: '-80px 0px -70% 0px'`），回调里收集所有 intersecting entries 后按 `boundingClientRect.top` 排序取最靠上——解决「多标题同时进视口时高亮乱跳」。首屏默认高亮首项。
- **点击跳转**：`e.preventDefault()` + `el.scrollIntoView({behavior:'smooth'})`；`history.replaceState(null,'','#id')` 写 URL hash 但不触发原生锚点跳转。
- **锚点不被 Navbar 遮挡**：`globals.css` 给 `.prose-article h2, .prose-article h3 { scroll-margin-top: 6rem; }`。
- **淡入淡出滚动条**：`.toc-scroll` 藏原生滚动条，浮 `.toc-thumb` 指示条按滚动比例算 `top`/`height`。显隐只由 hover 控制，`opacity transition` 淡入淡出。几何用 `ResizeObserver` + `requestAnimationFrame`，`document.fonts.ready` 兜底。
- **颜色联 Accent 主题**：用自定义 `.toc-link` / `.toc-link-active` 类（双前缀提特异性到 (0,3,1)，见约定 #26），**不用** Tailwind utility `text-accent-violet`。

## 19. 文章解析契约在 `parse-post.mjs`，`posts.ts` 只是读取层

- **共享解析契约**：解析规则（文件名→slug、`title ?? slug`、date 规整、excerpt 兜底、`tags ?? []`）唯一实现在 `src/lib/parse-post.mjs`（纯 ESM、无 fs、无 `server-only`），`posts.ts` 与 `scripts/gen-posts-index.js` **共用**（脚本侧 `await import` 动态加载）。改解析规则只改这一处；SearchModal 的索引类型也由此结构派生。
- **单次装载（无 mtime 缓存）**：`getAllPosts()` 首次调用时读目录 → 解析 → 排序，模块级 memo 缓存为不可变数组，之后派生查询。**不要在运行时修改 `content/posts/` 下的文件**——内容只在装载时读一次，修改需重新 `build`（或 dev 重启）才生效。
- **slug 解码统一在模块边界**：`getPostBySlug` / `getAdjacentPosts` 内部经 `decodeSlug()` 做一次 `decodeURIComponent`，非法编码（如孤立 `%`）按原样查找、自然未命中，**不抛异常**——不存在「有的函数吞异常、有的裸抛」的分裂语义。
- **excerpt 兜底**：未写 `excerpt` 时取正文前 160 字并 `replace(/[#*`\[\]]/g,'')`去掉 markdown 符号。注意这个正则会**误删反引号围栏代码块的内容**，含代码开头的文章建议显式写 `excerpt`。
- **日期格式**：`data.date` 被 `new Date(data.date).toISOString().split('T')[0]` 规整成 `YYYY-MM-DD`。frontmatter 里 `date` 写 `2026-01-01` 即可，时区差异由 `toISOString()` 处理。

## 20. 简历流式打印模块

`/about` 页内置终端式流式打印简历。数据源 `content/resume.md`，构建期 `getResumeMarkdown()`（`src/lib/resume.ts`，含 `node:fs`，**客户端组件不能 import 它**）同步读取注入 `ResumeTerminal`。行切分纯函数 `splitResumeLines` 在 `src/lib/resumeLines.ts`（客户端安全）。修改简历直接编辑 `content/resume.md`，无需改代码。支持的 Markdown 语法：`#/##/###` 标题、`- xxx` 列表、`> xxx` 引用、`---` 分隔线、`**粗体**`、`` `代码` ``，**不支持表格/图片**。

## 21. `reactStrictMode: true` 的副作用

开发模式下 effects 会执行两次（mount → unmount → mount）。`ResumeTerminal` 用 `startedRef` 守卫避免重复启动打印，`NavigationLoadingProvider` 用 `showTimerRef` / `fallbackRef` 守卫定时器，`SearchModal` 的延迟聚焦 `setTimeout` 用 `const t = setTimeout(...)` + `return () => clearTimeout(t)` 在 cleanup 中清。**新增带副作用的 client 组件时，务必做幂等清理**，否则 StrictMode 下会出现重复触发或定时器泄漏。

## 22. `trailingSlash: true`

所有路由以 `/` 结尾（如 `/posts/xxx/`）。`generateStaticParams` 与内部链接拼接都必须遵守，否则线上 404。Next `<Link>` 会自动处理，手拼 URL 时注意。

## 23. sharp / postcss overrides

`package.json` 的 `overrides` 锁定 `sharp: "^0.35.3"` 与 `postcss: "^8.5.25"`，保证静态导出 + `images.unoptimized: true` 场景下依赖树稳定。**升级这些包时要同步检查 overrides**，否则可能出现版本漂移导致构建失败。

## 24. Accent 主题强调色系统（运行时换色）

全站 6 个 accent 色（pink/violet/blue/teal/gold/rose）通过 CSS 变量 `--accent-*-rgb`（空格分隔 RGB 三元组）驱动，所有阴影/glow/hljs/prose-article 链接/resume-terminal/Aurora 文字渐变均经由 `rgb(var(--accent-xxx-rgb) / α)` 引用。**改 accent = 改这 6 个变量，全站联动。**

机制：`src/lib/accents.ts` 5 个预设（Aurora/Emerald/Sunset/Ocean/Sakura）+ `custom`，生成防 FOUC inline script `accentBootstrapScript`（`layout.tsx` 内联），storage key `aurora-accent`（当前预设 id）/`aurora-accent-custom`（自定义 JSON）。`AccentPicker.tsx` 是 Navbar 上的 🎆 图标。

约定：

- **新增 accent 色的 CSS**：用 `rgb(var(--accent-xxx-rgb) / α)`，**不要**写固定 `rgba(168, 85, 247, ...)` 或 `#a855f7`，否则换色不联动。
- **新增预设**：在 `ACCENT_PRESETS` 追加一项，**无需改 `layout.tsx`**——但 `presets` JSON 是构建期固化的，**新增预设后必须重新 build** 才能被防 FOUC script 识别。
- **改默认预设**：改 `DEFAULT_ACCENT_ID`。
- **亮/暗主题与 accent 正交**：next-themes 管 `.dark` 类，AccentPicker 管 `--accent-*-rgb`，两者互不干扰。

## 25. hover 变色不要走 Framer Motion，用纯 CSS

Framer Motion 的 `whileHover={{ color: 'rgb(var(--accent-violet-rgb))' }}` 会把动画后的 `color` 写成 **inline style**。CSS 变量在 inline style 中被解析成具体值（如 `rgb(168 85 247)`）后就**不再响应** `--accent-*-rgb` 的变化——切 Accent 主题色、切亮/暗模式时，标题会卡在动画那一刻的颜色上，看起来像「变白/变黑不响应主题」。

**正确做法**：hover 变色用纯 CSS（自定义类 + `:hover`），颜色完全交给 CSS 变量系统。PostCard 标题（`.post-card-title`）、「阅读」箭头（`.post-card-readmore` + `.post-card-link:hover`）就是这么改的。位移动画也一并迁到 CSS `transform`。

## 26. Tailwind v4 utility 的 layer 优先级坑

Tailwind v4 把 utility 类（`text-gray-500`、`group-hover/link:text-accent-violet` 等）注入到 `@layer utilities` 里。而 `globals.css` 中那些 `html:not(.dark) .text-gray-500 { color: #78716c }` 亮色覆盖规则是**裸 CSS**（不在任何 `@layer` 内）。**裸 CSS 优先级高于任何 `@layer` 内的同特异性规则**，所以亮色模式下 `group-hover/link:text-accent-violet` 这类 utility hover 会被裸覆盖规则持续压制，hover 不变色。

**正确做法**：需要响应 Accent 主题色联动的 hover 变色，**不要用 Tailwind utility**（`group-hover/link:text-accent-violet`），改用自定义 CSS 类（如 `.post-card-readmore`），用 `html.dark` / `html:not(.dark)` 双前缀提升特异性到 (0,3,1)，稳压裸覆盖规则。

## 27. globals.css 内同一元素的规则要集中，不要散乱

同一元素的暗色基与亮色覆盖（`html:not(.dark) ...`）必须写在相邻位置，避免「暗色基在文件头、亮色覆盖在文件尾」式的散乱——查样式要两头翻。**不写重复样式**：同一规则不得字面出现两次。

具体已集中的块：

- `::-webkit-scrollbar-thumb` / `.glass` / `.glass-heavy`：亮色覆盖并入 `@layer base` / `@layer utilities` 内暗色基旁。
- `.prose-article` 全系列（h1/h2/h3/p/a/code/pre/blockquote/table 等）：亮色覆盖并入 prose-article 块尾。
- Tailwind utility 亮色覆盖（`border-white/5` / `bg-white/5` / `text-gray-*` / `bg-surface` 等）：单独分组于文件尾，加「Tailwind utility 亮色覆盖」标题。

**新增元素的亮色覆盖**：紧贴其暗色基写，不要另起一处散到文件尾。

## 28. 含点号标签（如 `Next.js`）的 RSC payload 路径坑

Next `<Link>` 对含 `.` 的路径段（如 `/tags/Next.js/`）按「文件路径」处理，**渲染时会剥离尾斜杠**（`/tags/Next.js/` → `/tags/Next.js`），其他标签（如 `/tags/前端/`）不受影响。这导致客户端软导航请求 RSC payload 走 `/tags/Next.js.txt`，而静态导出实际生成在 `/tags/Next.js/index.txt` → 线上 404（页面能打开，但控制台报错、软导航降级）。

**修复**：`scripts/gen-dotted-tag-payloads.js` 在 build 流水线末尾扫描 `out/tags/`，把含点号目录的 `index.txt` 复制为 `<名字>.txt`，补齐客户端实际请求的路径。**新增含点号标签后无需改代码**——脚本自动处理；但必须重新 `npm run build` 才生效。

## 29. 弹层关闭统一走 `useDismiss`

`src/components/UI/useDismiss.ts` 收口「点击外部 / Esc 关闭」：外点用 mousedown 判定 + `setTimeout(0)` 延迟绑定（避开「触发弹层打开的同一次点击」这个坑）+ cleanup 解绑。**ref 必须包裹「开关按钮 + 浮层」**，否则点击开关会被误判为外点，与按钮 `onClick` 形成开关竞态。已用于 AccentPicker / FilterDropdown / SearchModal；**Navbar 移动菜单**用 `{ outside: false }` 只启用 Esc（开关按钮在 header、浮层外，mousedown 外点判定会误关），外点关闭继续由遮罩 `onClick` 负责。**新增弹层组件时直接用 `useDismiss`，不要手写第四份监听。**

## 30. `posts-index.json` 是构建产物，已被 `.prettierignore` 忽略

`public/posts-index.json` 由 `scripts/gen-posts-index.js` 用 `JSON.stringify` 生成（紧凑格式，与 Prettier 风格不一致），已在 `.prettierignore` 忽略——`format:check` / lint-staged 都会跳过它。**不要**手动格式化它，也不要把它从 `.prettierignore` 移除；改索引字段改 `parse-post.mjs` 或脚本的字段选取。

## 31. Turbopack 无法解析 Tailwind v4.3 的生成 CSS，dev/build 用 `--webpack`

Next 16 默认用 Turbopack 构建，会对 Tailwind v4.3 生成的 `@layer properties{@supports ...}` 报 `Invalid dangling combinator in selector`（Turbopack 解析器缺陷，非本站 CSS 问题）。因此 dev / build 脚本都显式加 `--webpack`。**不要**移除该 flag，也不要改 globals.css 去规避。问题在 Turbopack 上游，升级 Next 补丁版后本地跑 `NEXT_BUILD=1 npx next build`（不带 `--webpack`）验证：能通过即移除 flag。

## 32. 动画时长限制：0.01ms（`prefers-reduced-motion` 降级值）

globals.css 的 `@media (prefers-reduced-motion: reduce)` 块把 `animation-duration` / `transition-duration` 强制压到 **0.01ms !important**（实质禁用动画），服务于无障碍。

- **纯 CSS 动画自动合规**：`transition` / `animation` 实现的 hover、下划线滑入等被 `*` 选择器 + `!important` 自动压到 0.01ms。
- **Framer Motion 绕开降级**：Framer 用 JS rAF + inline style 驱动位移，inline style 的 `transform` 不受 `transition-duration` 影响。这是「功能性可见动画」的有意例外——但 hover 变色仍走纯 CSS（#25）。
- **装饰性 JS 动画入阀（站内已实现）**：`AmbientEffects` 用 `prefers-reduced-motion` 门控 `CursorGlow`（光晕）与 `ClickEffect`（点击特效）；`ScrollProgress` 保留功能性指示条但 spring 平滑用 `useReducedMotion()` 守卫；`ParticleField` 内部自检（reduced 下只画静态帧）。新增装饰性 JS 动画记得入阀（见 §11）。
- **新增动画前 checklist**：
  1. 优先纯 CSS（`transition` + `transform`/`opacity`/`width` 等合成层属性），自动被 0.01ms 降级覆盖。
  2. 避免 `transition: all`（会动画非合成属性，触发 layout/paint）。
  3. 若用 Framer Motion 驱动可见位移，确认该动画在 reduced-motion 下是否应降级——若应降级，改用纯 CSS 或在 `useReducedMotion()` 守卫下跳过。
  4. hover 变色不交给 Framer（#25）。

## 33. 仓库内图片用 `<Image />`，别用原生 `<img>`

静态导出（`images.unoptimized: true`）下 `next/image` 退化为原图直出，但仍享受 basePath 自动注入与尺寸约束。**Server Component 里的 `<Image>` 由 Next 自动注入 basePath**（直接写 `src="/logo.svg"`）；**客户端组件需手动 `withBase()`**（见 #1）。外部小图（如友链头像 URL）用原生 `<img>` 是可接受例外（eslint 已降为 warn）。

## 34. 图片 onError 降级走 state

图片加载失败（如外链头像 404）的降级切换用组件 state 驱动（`setState` → 换 fallback 源/占位），**不要直接操作 DOM**（`el.src = ...`）。与 React 声明式模型一致，且 StrictMode 双执行下幂等。

## 35. CSS 集中 `src/styles/`

所有 `.css` 文件统一放 `src/styles/`，组件内 `import '@/styles/xxx.css'` 按需引入，全局样式由 `layout.tsx` 统一 import。**禁止在组件目录散落 `.css`**。共享终端外壳（macOS 圆点标题栏）抽为 `UI/TerminalShell.tsx` 组件（title/status prop），各页面不手抄。

## 36. 终端外壳抽 `UI/TerminalShell.tsx`

终端风页面（关于页简历 / 友链页）的「毛玻璃窗口 + 红黄绿圆点标题栏 + 状态行」外壳由 `TerminalShell` 统一提供，页面只传 `title` / `status` prop。样式在 `styles/terminal-base.css`。**新增终端风页面直接复用，不手抄圆点标题栏。**

## 37. Giscus 评论收口 `Post/PostComments.tsx`

- 属性必须 **kebab-case**（`data-repo-id`、`data-mapping`，React 不认驼峰传给 web component）。
- 关联策略：`mapping='og:title'` + `strict='1'`——按文章标题关联 GitHub Discussions；CJK 下摘要搜索（`pathname`/`url` 之外的模糊匹配）不可靠。**改文章标题会使历史评论失联**，先改 Discussions 侧。
- 主题：官方 `light` / `dark`（跟随站点主题类）；`transparent_light` 上游 404 不可用。
- Edge 浏览器的「Images loaded lazily」干预警告来自 widget 内部懒加载头像，属 giscus 自身行为，宿主页无法消除，不是 bug。

## 38. 项目页 `ProjectsContent`（数据/样式双收口）

- 数据：只改 `src/lib/projects.ts`（数组末尾 push 一条对象），不改组件。
- 样式：收口 `src/styles/projects.css`——标题渐变（`.project-card-title`）、语言色文字（`.project-lang-text`，亮色下 `color-mix` 混黑加深）、hover 光晕（`.project-card-glow` / `.project-card-border-glow`）的亮暗双态。
- 竖线色：`hashBarColor(url)` 纯函数（URL 确定性哈希 → 15 色池），**别用 `Math.random()`**——渲染期随机触发 `react-hooks/purity` lint 报错且 hydration 不稳定。
- hover 光晕：`onMouseMove` 写 `--mx`/`--my`，纯 CSS 渐变层跟随；离开复位 50%/50%。

## 39. 版权年份用 `siteConfig.copyrightYear` 常量

`src/lib/site.ts` 的 `copyrightYear: 2026` 固定值，Footer 与 Navbar 抽屉的 `©` 行都走它。

**为什么不用 `new Date().getFullYear()`**：客户端组件在静态导出下，SSR 用**构建时**年份生成 HTML，hydration 时客户端用**访问时**年份重新渲染——跨年（12/31 构建、1/1 访问）或时区差异下产生 hydration mismatch（React 属性/文本 diff 警告，StrictMode 下更明显）。mismatch 平时看不到，跨年是真实线上 bug。

每年元旦手动更新一次常量即可（site.ts 有注释提醒）。

## 40. 公共实现收口别手抄

六处收口（出现第二份复制时就收口，别等第三份）：

| 收口       | 文件                    | 背景                                                                                           |
| ---------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| 日期格式化 | `lib/formatDate.ts`     | zh-CN 长格式 + 模块级 Map 缓存；此前 SearchModal（有缓存）/PostCard/PostMeta（无缓存）三份实现 |
| 滚动锁     | `UI/useScrollLock.ts`   | body overflow 保存/还原；Navbar 抽屉与 SearchModal 曾各写一份，**同开时还原互相覆盖**          |
| 焦点陷阱   | `UI/useFocusTrap.ts`    | Tab 循环 + 关闭焦点还原；搜索模态 + 移动抽屉共用                                               |
| 返回顶部   | `UI/BackToTop.tsx`      | scrollY 阈值 + Tooltip 圆钮 + 平滑回顶；Footer/PostMeta 两份复制收敛                           |
| 主题色同步 | `UI/ThemeColorSync.tsx` | meta theme-color 动态跟随主题（须在 ThemeProvider 内读 resolvedTheme）                         |
| 搜索匹配   | `lib/search.ts`         | tokenize/searchPosts/splitByTerms 纯函数，组件只渲染                                           |

## 41. sitemap 别设 `revalidate = 0`

**历史 bug**：`sitemap.ts` 同时写 `export const dynamic = 'force-static'` 与 `export const revalidate = 0`——后者强制动态渲染、覆盖前者。build 后路由表显示 `/sitemap.xml` 是 `ƒ`（Dynamic），`out/` 里没有 sitemap.xml，**线上一直缺 sitemap**（爬虫拿不到站点地图）。

**验证方法**：`npm run build` 后看路由表该行是 `○`（Static）还是 `ƒ`；`ls out/sitemap.xml`。中文 slug 记得 `encodeURIComponent`（XML 需要百分号编码）。

## 42. 与 framer inline transform 叠加用 CSS 独立 `scale`/`translate`

**场景**：元素同时有 Framer Motion 写的 inline `transform`（Hero CTA 跟手 `x/y`、卡片 tilt 等）和 CSS 缩放/位移需求。CSS `transform: scale(...)` 会被 inline style **覆盖失效**；独立属性 `scale:` / `translate:` 与 transform 独立叠加（组合语义 translate → rotate → scale），互不干扰。

**用法**（`.hero-cta`）：`:hover { scale: 1.02; translate: 0 -2px; }`，`:active { scale: 0.98; translate: 0 0; }`（源序在 hover 后，按下时取消上浮）。

**支持**：Chrome 104+ / Firefox 72+ / Safari 14.1+（2026 年无兼容顾虑）。

## 43. reduced-motion 区分功能性/装饰性

`usePrefersReducedMotion()` 为 true 时：

- **功能性（必须保留）**：滚动淡出（Hero 标题/提示的 scrollY→opacity）——reduced 用户也要「滚动后首屏隐藏」；ScrollProgress 进度条（spring 平滑入阀）。
- **装饰性（跳过）**：视差位移（titleY/midY/farY）、入场动画（initial→animate）、无限循环（Footer 走马灯/箭头/呼吸点）、鼠标跟手（CTA 按钮 x/y）。

**历史 bug**：HeroParallax 的 reduced 分支曾把整个 `style` 置 `undefined`，标题层 opacity 永不淡出 → 首屏文字滚动后一直显示。判断标准：动画承载信息（隐藏/进度）还是纯氛围？信息→保留，装饰→跳过。

## 44. 生成脚本收口（都复用 `parse-post.mjs`）

| 脚本                         | 产物                                                      | 触发              |
| ---------------------------- | --------------------------------------------------------- | ----------------- |
| `gen-posts-index.js`         | public/posts-index.json（⌘K 搜索索引）                    | predev / prebuild |
| `gen-feed.js`                | public/feed.xml（RSS 2.0 + 全文 CDATA + 标签）            | predev / prebuild |
| `gen-og-image.js`            | public/og.png（1200×630 社交卡片，纯 Node zlib PNG 编码） | prebuild          |
| `gen-dotted-tag-payloads.js` | out/ 内点号标签 payload 副本（#28）                       | build 后          |

- 前三者复用 `src/lib/parse-post.mjs` 解析契约（CJS 脚本 `await import` ESM）。
- `gen-feed.js` 的站点常量与 `site.ts` **字面一致**——改站点信息（title/description/url）需同步两处。
- 产物在 `public/` 且已提交；prebuild 确定性重建，无 git 噪音。

## 45. CI 质量门禁（对齐 #8）

`deploy.yml` 构建前先跑 `typecheck` → `lint` → `test`：

- **步骤严格串行**（GitHub Actions 单 job）：默认前一步失败后续全部跳过。
- lint/test 加 `if: always()`：即使前一步失败也跑完，**一次 CI 暴露全部失败**；Build 用默认 `success()` 条件，任一门禁失败即跳过部署。
- 对齐 #8：Next 16 的 `next build` 不再执行 lint，CI 必须单独跑，否则门禁形同虚设。

## 46. 组件测试（jsdom）三坑

`tests/search-modal.test.tsx` 用 `// @vitest-environment jsdom` 单文件切换环境（vitest.config 默认 node；include 已扩展为 `tests/**/*.test.{ts,tsx}`）。三个必踩的坑：

1. **cleanup**：vitest 未开 `globals: true` 时全局没有 `afterEach`，RTL 的自动 cleanup 不生效——必须显式 `afterEach(cleanup)`，否则多 render 的 DOM 累积报 "Found multiple elements with the placeholder"。
2. **matchMedia**：jsdom 不实现 `window.matchMedia`，framer-motion 挂载即炸——需垫片（matches/media/onchange + add/removeEventListener + add/removeListener/dispatchEvent）。
3. **依赖 mock**：`vi.mock('next/link')` 成纯 `<a>`；`vi.mock('next/navigation')` 提供可控 `useRouter`；fetch 用 `vi.stubGlobal` 并在 `afterEach` 里 `vi.unstubAllGlobals()`。

另外：空查询时组件有意不渲染结果（`searchPosts` 空词元返回 `[]`），断言前必须先输入；断言结果标题用 `getByRole('link')` + textContent 包含（嵌套 `<span>` 会让字符串匹配失败）。

## 47. Hover 变色走纯 CSS（对齐 #25/#26）

Tailwind v4 把 utility 类注入到 `@layer utilities` 里。而 `globals.css` 的亮色覆盖规则（`html:not(.dark)`）是**裸 CSS**——优先级高于 `@layer utilities` 内的同特异性规则。因此 `hover:text-accent-violet` 这类 utility hover 在亮色模式下会被裸覆盖持续压制，hover 不变色。

**正确做法**：accent 联动 hover 变色用自定义 CSS 类 + `html.dark` / `html:not(.dark)` 双前缀，特异性拉到 (0,3,1)，稳压裸覆盖规则。示例——`ErrorBoundary` 重试按钮（`.btn-retry`）：

```css
.btn-retry {
  color: #ffffff;
  transition: color 0.2s;
}
html:not(.dark) .btn-retry {
  color: #1c1917;
}
html.dark .btn-retry:hover,
html:not(.dark) .btn-retry:hover {
  color: rgb(var(--accent-violet-rgb));
}
```

**不要**用 `hover:text-accent-violet transition-colors`——它会被亮色裸覆盖压制失效。同样，Framer Motion 的 `whileHover={{ color: '...' }}` 也会把颜色写成 inline style，CSS 变量在 inline style 中被解析成具体值后不再响应 accent 切换。

## 48. 全站 Error Boundary（`src/components/ErrorBoundary.tsx`）

包裹 `Providers` 顶层，兜底任何未捕获的 client 组件异常（`Navbar` / `SearchModal` / `HeroParallax` 等抛异常会直接白屏整页）。

实现要点：

- **`getDerivedStateFromError` + `componentDidCatch` 加 `override`**：tsconfig 有 `noImplicitOverride: true`，不加会报 TS4114。
- **`getDerivedStateFromError` 是纯函数**，无副作用，StrictMode 安全（约定 #21）。
- **生产环境静默**：`componentDidCatch` 只在 `NODE_ENV === 'development'` 时 `console.error`，不暴露内部信息。
- **重试按钮 hover 走纯 CSS**（见 #47），不能用 `hover:text-accent-violet`。
- 错误 UI 显示通用文案「出了点问题」+ 重试按钮（调 `setState({ hasError: false })` 触发重渲染）。
