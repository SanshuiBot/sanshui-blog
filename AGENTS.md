# AGENTS.md — sanshui-blog

三水个人博客：Next.js 16.3（App Router 静态导出）+ React 19 + TS 5 strict + Tailwind v4 + Framer Motion 12。GitHub Pages（basePath `/sanshui-blog`），默认亮色、暗色可选，「Aurora 玻璃态」设计系统。

## 命令

| 用途 | 命令                              | 备注                                                                                  |
| ---- | --------------------------------- | ------------------------------------------------------------------------------------- |
| 开发 | `npm run dev`                     | predev 建索引/feed；不设 `NEXT_BUILD`；`--webpack`（#31）                             |
| 构建 | `npm run build`                   | 索引/feed/og → `NEXT_BUILD=1 next build --webpack` 导出 → dotted-tag（#28）→ 产物清理 |
| Lint | `npm run lint` / `lint:fix`       | 构建不跑 lint，须单独跑（#8）                                                         |
| 格式 | `npm run format` / `format:check` | Prettier                                                                              |
| 类型 | `npm run typecheck`               | `tsc --noEmit`（strict）                                                              |
| 测试 | `npm run test`                    | Vitest：lib 纯函数/契约 + jsdom 组件测试（RTL）                                       |
| 预览 | `npx serve out`                   | 构建产物                                                                              |
| 提交 | `git commit`                      | Husky：prettier(暂存) → typecheck → test                                              |

> 别用 `npm start`（纯静态导出）。

## 布局

```
content/   posts/*.md(x)（文件名即 slug）+ resume.md
src/app/   App Router 页面；src/components/ 组件；src/styles/ CSS（集中 #35）
src/lib/   纯函数/读取层（formatDate/search/post-index 为客户端安全模块），职责看文件头
scripts/   predev.js gen-posts-index.js gen-feed.js gen-og-image.js gen-dotted-tag-payloads.js post-build-cleanup.js
tests/     lib 单测 + jsdom 组件测试（RTL）；public/ 静态资源 + 产物（posts-index.json feed.xml og.png）
```

## 红线（48 条；详版见 docs/conventions.md §N）

1. `NEXT_BUILD` 双态（dev 不设/build 必设），别手动设 `output:'export'`。basePath：`<Link>`/router 自动注入别套 withBase；`<Image>`/原生 `<a>`/`<img>`/`<link>`/`fetch()` 必须套；metadata 图走 metadataBase 裸路径。`<Link>` 只用于真实路由（静态文件用原生 `<a>`+withBase）。
2. `params` 是 Promise，必须 `await`。
3. 中文 slug：`getPostBySlug`/`getAdjacentPosts` 内部已 decode。
4. `generateStaticParams` 返回全部 slug；新文章要重新 build。
5. `'server-only'`：posts/toc/types.ts 只在 RSC 用；客户端 fetch posts-index.json。
6. 索引访问判空（`arr[0]` 是 `T|undefined`）；未用变量是 error。
7. 安全头/重定向走 `public/_headers`、`_redirects`，不走 next.config。
8. 构建期不跑 lint，CI/本地单独跑。
9. `images.unoptimized`：next/image 原图直出，新图自行压缩。
10. Tailwind v4 CSS-first（`@import 'tailwindcss'` + `@theme`），无 config。
11. 客户端动效在 `AmbientEffects` 用 `dynamic(...,{ssr:false})` 注册；别自定义 splitChunks。装饰性 JS 动效（PostCard spotlight/3D tilt 收口 `Post/CardSpotlight.tsx`）非骨架才挂载，cleanup 调 onRefs(null)。
12. 默认亮色（`html:not(.dark)`），改暗色同步查亮色分支。
13. 导航加载：仅 `/posts/...` 的 `<Link>` 调 `startNavigation`；详情页挂载调 `done()`。
14. ⌘K 搜索 fetch `posts-index.json`，不序列化进 RSC。
15. 卡片流式渲染：同帧叠加、`h-60`、`slot-${i}` key、`prefetchedRef` 随 slug 重置。
16. MDX：`next-mdx-remote/rsc`+gfm+slug+highlight；文章内不用 React 组件。
17. 文章样式走 `.prose-article`，不是 Tailwind `prose`。
18. TOC 只提 h2/h3，id 与 rehype-slug 同 github-slugger；进目录标题必须 `##`/`###`。
19. 解析契约只在 `parse-post.mjs`，改解析只改它。
20. 简历改 `content/resume.md` 即可；不支持表格/图片。
21. StrictMode effects 双执行，client 副作用要幂等清理。
22. `trailingSlash`：路由都以 `/` 结尾。
23. sharp/postcss 在 overrides 锁版本，升级同步检查。
24. Accent 色用 `rgb(var(--accent-xxx-rgb)/α)`，不写固定 rgba/hex；新预设只改 `ACCENT_PRESETS`。
25. hover 变色纯 CSS，不交 Framer（变量会被解析卡色）。
26. Accent 联动 hover 不用 Tailwind utility，自定义类 + `html.dark`/`:not(.dark)` 双前缀。
27. globals.css 同一元素规则集中，亮色紧贴暗色基写。
28. 点号标签（Next.js）由 `gen-dotted-tag-payloads.js` 补副本；新增要重新 build。
29. 弹层关闭统一 `useDismiss`（ref 包开关+浮层）。
30. `posts-index.json` 是产物（prettierignore），别手动格式化。
31. Turbopack 解析不了 Tailwind v4.3 CSS，dev/build 用 `--webpack`，别移除。
32. 动画优先纯 CSS（自动合规 reduced-motion 0.01ms）；装饰性 JS 动画（光晕/点击特效）纳入 `AmbientEffects` 的 reduced-motion 阀门；检测统一走 `UI/usePrefersReducedMotion`，别手抄 matchMedia。
33. 仓库内图片用 `<Image />`，别用原生 `<img>`（外部小图例外）。
34. 图片 onError 降级走 state，不操作 DOM。
35. CSS 集中 `src/styles/`，禁止组件目录散落 .css。
36. 终端外壳抽 `UI/TerminalShell.tsx`（title/status prop），别手抄。
37. Giscus 收口 `Post/PostComments.tsx`：属性 kebab-case；`og:title`+`strict='1'`（CJK 搜索不可靠）；主题 `light`/`dark`（transparent_light 上游 404）；Edge 懒加载警告来自 widget 内部，不可修。
38. 项目页 `ProjectsContent`：数据只改 `lib/projects.ts`；样式收口 `styles/projects.css`；竖线色按 URL 哈希取（纯函数，别 `Math.random()`）；hover 光晕用 `--mx/--my`；语言色文字亮色下 `color-mix` 混黑加深。
39. 版权年份用 `siteConfig.copyrightYear` 常量，别 `new Date().getFullYear()`（hydration mismatch）。
40. 公共实现收口别手抄：`lib/formatDate`、`UI/useScrollLock`、`UI/useFocusTrap`、`UI/BackToTop`、`UI/ThemeColorSync`、`lib/search`（空格分词 AND + 高亮片段）。
41. sitemap 别设 `revalidate = 0`：会覆盖 `force-static`（历史 bug）。
42. 与 framer inline transform 叠加的缩放/位移用 CSS 独立 `scale`/`translate`，别用 `transform`（会被内联覆盖）。
43. reduced-motion 区分功能性/装饰性：滚动淡出（hero 标题/提示）必须保留，只跳视差/入场/循环。
44. 生成脚本收口：`gen-posts-index.js`/`gen-feed.js`/`gen-og-image.js` 都复用 `parse-post.mjs`。
45. CI 门禁：typecheck/lint/test 在 build 前跑；lint/test 加 `if: always()`（前一步失败也全跑）。
46. 组件测试（jsdom）手动 `afterEach(cleanup)`：vitest 未开 globals，RTL 不自动清 DOM。
47. Hover 变色走纯 CSS（自定义类 + 双前缀，见 conventions §26）。Tailwind hover utility 会被裸 CSS 亮色覆盖压制，不变色。新增 accent 联动 hover 一律用自定义 CSS 类。
48. 全站 Error Boundary 收口 `src/components/ErrorBoundary.tsx`，包裹 Providers 顶层——client 组件抛异常显示通用错误 UI + 重试按钮。class 方法加 `override`（noImplicitOverride）。

## 内容编辑

- Frontmatter：`title`/`date` 必填；`tags`/`excerpt` 可选（不写截 160 字）。
- TOC 自动提 `##`/`###`；代码块自动高亮 + 复制按钮。
- Giscus 评论按 og:title 关联——**改标题会使评论失联**，先改 Discussions。
- 新文章 predev/prebuild 自动重建索引；线上 HTML 要重新 build。

## 其他

- 排查路由以 `src/app/` 为准；`out/` 是产物（gitignore），别清。
- Agent skills（issue-tracker / triage-labels / domain）见 `docs/agents/`。
- ADR（docs/adr/）：0001 TOC 几何 · 0002 Accent 解析统一 · 0003 useSafeTimeout primitive · 0004 PostIndexEntry 适配器；候选 ⑤（basePath 双态）不深化。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
