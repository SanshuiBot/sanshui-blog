# AGENTS.md — sanshui-blog

三水的个人博客。Next.js 16.3（App Router，纯静态导出 `output: 'export'`）+ TypeScript 5 strict + Tailwind CSS v4 + Framer Motion 12。托管在 GitHub Pages，basePath `/sanshui-blog`，部署走 `.github/workflows/deploy.yml`。默认亮色主题、暗色可选（约定 #12），「Aurora 玻璃态」设计系统。

---

## 命令

| 用途     | 命令                                      | 备注                                                                                                                                                                                   |
| -------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 开发     | `npm run dev`                             | `predev` 跑 `scripts/predev.js` + `scripts/gen-posts-index.js`。dev **不设** `NEXT_BUILD`，用 `next dev --webpack`（约定 #31）。                                                       |
| 生产构建 | `npm run build`                           | `prebuild` 重新生成 `posts-index.json` → `cross-env NEXT_BUILD=1 next build --webpack``（静态导出到 `out/`）→ `pagefind --site out`→`scripts/gen-dotted-tag-payloads.js`（约定 #28）。 |
| Lint     | `npm run lint` / `npm run lint:fix`       | ESLint v9 flat config（`next/core-web-vitals` + `next/typescript`）。Next 16 构建不跑 lint，CI/本地须单独跑。                                                                          |
| 格式化   | `npm run format` / `npm run format:check` | Prettier（见 `.prettierrc`）。                                                                                                                                                         |
| 预览产物 | `npx serve out`                           | 本地起 HTTP 服务器看构建结果。                                                                                                                                                         |
| 类型检查 | `npm run typecheck`                       | `tsc --noEmit`（`strict` + `noUncheckedIndexedAccess` + `noUnusedLocals` + `noUnusedParameters`）。                                                                                    |
| 测试     | `npm run test`                            | Vitest（`vitest run`）：lib 层纯函数与契约测试，见 `tests/`（`'server-only'` 由 `tests/stubs/server-only.ts` 兜底）。                                                                  |
| 提交门禁 | `git commit`                              | Husky pre-commit：lint-staged（Prettier 暂存文件）→ `npm run typecheck` → `npm run test`。                                                                                             |

> ⚠️ **不要用 `npm start`**：纯静态导出，`next start` 无意义。

---

## 顶层布局

```
sanshui-blog/
├── content/
│   ├── posts/*.md(x)        # 文章源，frontmatter：title/date/tags/excerpt
│   └── resume.md            # 简历源，构建期 fs.readFileSync 注入 /about
├── src/
│   ├── app/                 # App Router 页面：layout/page/globals.css/fonts/not-found + about/ archive/ tags/[tag]/ posts/[slug]/ links/
│   ├── components/          # Providers · AmbientEffects · AppShell · Layout/ · Home/ · Post/ · About/ · Links/ · NotFound/ · UI/ · TagList.tsx
│   │   └── Home/            # HeroParallax（视差拼贴首屏，3 深度层）· HomeHydration（懒加载入口）· PostsList
│   └── lib/                 # types.ts · posts.ts · parse-post.mjs · toc.ts · resume.ts · resumeLines.ts · accents.ts · site.ts · basePath.ts · thumbGeometry.ts · clickParticles.ts · post-index.ts
├── tests/                   # Vitest 单测：lib 纯函数与契约
├── scripts/                 # predev.js · gen-posts-index.js · gen-dotted-tag-payloads.js
├── public/                  # favicon · logo · posts-index.json（构建产物）· _headers · _redirects
├── next.config.ts           # NEXT_BUILD 双态切换的核心
└── .github/workflows/deploy.yml  # CI：Node 24 + npm ci + npm run build + 部署 ./out 到 GitHub Pages
```

> lib 每个文件的职责直接看 `list_symbols` / 源文件头注释，不在此赘述。

---

## 关键约定（红线清单）

每条一句话红线，展开细节见 [`docs/conventions.md`](docs/conventions.md)——只在要动相关代码时再读。

1. **`NEXT_BUILD=1` 双态切换**：dev 不设、build 必设；客户端要 basePath 走 `withBase()`，原生 `<link>`/`<a>`/`<img>` 也得 `withBase()`；**不要手动设 `output: 'export'`**。
2. **异步 params**：`posts/[slug]`、`tags/[tag]` 的 `params` 是 `Promise`，必须 `await`。
3. **中文 slug 与 URL 编码**：`getPostBySlug`/`getAdjacentPosts` 内部已 decode，跨层传递注意 decode。
4. **`generateStaticParams` 必须返回所有 slug**；新增文章无需改代码，但**线上 HTML 要重新 `build`** 才更新。
5. **`'server-only'` 限制**：`posts.ts`/`toc.ts`/`types.ts` 只能在 RSC 调用，客户端要数据 fetch `posts-index.json`。
6. **TS 严格到索引访问**：`arr[0]` 是 `T | undefined`，下标访问后判空或 `!`；未用变量是 error。
7. **静态导出安全头走 `public/_headers`**，不是 `next.config.ts` 的 `headers()`；`_redirects` 同理。
8. **构建期不跑 lint**（Next 16 移除 `--no-lint`）：CI/本地须单独跑 `npm run lint`。
9. **图片 `images.unoptimized: true`**：静态导出无优化器，`next/image` 退化为原图直出，新增图片自行压缩。
10. **Tailwind v4 CSS-first 语法**（无 `tailwind.config.js`）：`@import 'tailwindcss'` + `@theme`；不要新建 config。
11. **客户端动效组件懒加载**：在 `AmbientEffects` 用 `dynamic(() => import, { ssr: false })` 注册；不要再自定义 `splitChunks`。
12. **亮色为主、暗色可选**：默认亮色（`html:not(.dark)`）；改暗色变量时同步检查亮色分支。
13. **导航加载状态**：**只有跳 `/posts/...` 的 `<Link>` 调 `startNavigation`**；详情页挂载时调 `done()`。其他入口（导航/标签/归档/友链）**一律不加**。
14. **全局搜索（⌘K）**：数据 `fetch('/posts-index.json')`，**不**序列化进 RSC payload；与 Pagefind 是两套机制。
15. **文章卡片网格「跟手」流式渲染**：骨架与卡片同一 DOM 帧叠加、固定 `h-60`、稳定 `slot-${i}` key、`animate` 入场、同 transition、`prefetchedRef` 随 slug 重置。
16. **MDX 渲染管线**：`next-mdx-remote/rsc` + `remark-gfm` + `rehype-slug` + `rehype-highlight`；**不要在文章 MDX 用 React 组件**。
17. **文章样式走 `.prose-article`**，不是 Tailwind Typography 的 `prose` 类。
18. **TOC 只提取 h2/h3**，id 与 rehype-slug 共用同一 `github-slugger`；**新增进目录的标题必须用 `##`/`###`**。
19. **文章解析契约在 `parse-post.mjs`**，`posts.ts` 只是读取层；改解析规则只改这一处。
20. **简历流式打印**：数据源 `content/resume.md`，直接编辑文件，无需改代码；**不支持表格/图片**。
21. **`reactStrictMode: true` 的副作用**：effects 执行两次，新增带副作用的 client 组件务必做幂等清理。
22. **`trailingSlash: true`**：所有路由以 `/` 结尾，手拼 URL 时注意。
23. **sharp / postcss overrides**：`package.json` 锁版本，升级这些包要同步检查 overrides。
24. **Accent 主题强调色系统**：所有 accent 色用 `rgb(var(--accent-xxx-rgb) / α)`，**不要写死 `rgba()`/`#hex`**；新增预设只改 `ACCENT_PRESETS`。
25. **hover 变色不要走 Framer Motion，用纯 CSS**：Framer 会把 CSS 变量解析成具体 inline 值，切主题/亮暗色时卡色。
26. **Tailwind v4 utility 的 layer 优先级坑**：响应 Accent 主题色联动的 hover 变色**不要用 Tailwind utility**，改用自定义 CSS 类 + `html.dark`/`html:not(.dark)` 双前缀提特异性到 (0,3,1)。
27. **globals.css 内同一元素的规则要集中**：亮色覆盖紧贴暗色基写，不散到文件尾；不写重复样式。
28. **含点号标签（如 `Next.js`）的 RSC payload 路径坑**：`scripts/gen-dotted-tag-payloads.js` 自动补 `<名字>.txt`；新增含点号标签无需改代码，但要重新 `build`。
29. **弹层关闭统一走 `useDismiss`**：ref 必须包裹「开关按钮 + 浮层」；**新增弹层直接用 `useDismiss`，不要手写第四份监听**。
30. **`posts-index.json` 是构建产物**，已被 `.prettierignore` 忽略；**不要手动格式化它**。
31. **Turbopack 无法解析 Tailwind v4.3 的生成 CSS**，dev/build 用 `--webpack`；**不要移除该 flag**。
32. **动画时长限制：0.01ms（`prefers-reduced-motion` 降级值）**：新增动画优先纯 CSS（自动合规），避免 `transition: all`，hover 变色不交给 Framer。

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

### ADR index

架构决策记录在 `docs/adr/`，每条记一次深化决策及其「为什么这么选」——未来探索者会想知道的门槛：

| ADR                                                   | 候选                     | commit    | 一句话                                                                                  |
| ----------------------------------------------------- | ------------------------ | --------- | --------------------------------------------------------------------------------------- |
| [0001](docs/adr/0001-toc-thumb-geometry-deepening.md) | TOC 指示条 locality      | `bede4a0` | thumb 几何公式 + 副作用编排收进同一可测 hook `useScrollThumbGeometry`                   |
| [0002](docs/adr/0002-accent-resolver-unification.md)  | Accent 三解析器发散      | `2f16f1e` | `resolveAccentColors` 唯一真相源，inline script 补 channel 校验修 partial FOUC          |
| [0003](docs/adr/0003-use-safe-timeout.md)             | useSafeTimeout primitive | `7cabc65` | 卸载安全定时器 primitive，Tooltip / NavigationLoading / ResumeTerminal 三处手写仪式统一 |
| [0004](docs/adr/0004-post-index-entry-adapter.md)     | PostIndexEntry 适配器    | `cf9be31` | 文章索引条目形状收口到 client-safe `post-index.ts`，替掉 SearchModal 手抄 SearchPost    |

候选 ⑤（`next.config.ts` / `basePath.ts` 双态切换）判定为「Do not deepen」——正确尺寸的浅缝，保持现状。
