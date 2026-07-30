<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 三水博客 — 项目指南

## 构建命令

| 命令              | 作用            | 注意事项                                                            |
| ----------------- | --------------- | ------------------------------------------------------------------- |
| `npm run dev`     | 开发服务器      | `predev` 自动生成 `.next/routes-manifest.json`（ConsoleNinja 兼容） |
| `npm run build`   | 生产构建        | 静态导出 + Pagefind 搜索索引；设置 `NEXT_BUILD=1` 环境变量          |
| `npm run start`   | 生产服务器      | 纯静态导出，通常不用，静态托管在任意 HTTP 服务器即可                |
| `npm run lint`    | ESLint 检查     | ESLint v9 flat config，只报告不修改                                 |
| `npm run lint:fix`| ESLint 自动修复 | 运行 ESLint 并自动修复可修复的问题                                  |
| `npm run format`  | Prettier 格式化 | 配置见 `.prettierrc`                                                |

## 构建脚本流程

```
npm run dev
  └─ predev: ConsoleNinja 兼容脚本 (scripts/predev.js)
        生成 .next/routes-manifest.json
  └─ next dev (HMR，无 basePath/assetPrefix)

npm run build
  └─ prebuild: 生成轻量文章索引 (scripts/gen-posts-index.js)
        → public/posts-index.json (~3KB，SearchModal 运行时 fetch)
  └─ cross-env NEXT_BUILD=1 next build --no-lint
        → 静态导出 out/
  └─ pagefind --site out
        → 全文搜索索引
```

## 架构要点

- **全静态博客** — 无 API 路由，所有数据在构建时从文件系统读取
- **内容驱动** — `content/posts/` 下的 `.md` 文件，gray-matter frontmatter 解析。文件名即为 slug（含中文）
- **MDX 渲染** — `next-mdx-remote/rsc`，插件链：remark-gfm → rehype-slug → rehype-highlight
- **客户端提供者** — `Provider.tsx` 包裹：next-themes、CursorGlow、ScrollProgress、ClickEffect、Navbar、Footer
- **路径别名** — `@/*` → `./src/*`
- **Pagefind** — `build` 末尾对 `out/` 生成搜索索引

## ⚠️ 关键陷阱

### 1. 静态导出通过环境变量切换

`next.config.ts` 中 `output: 'export'`、`basePath`、`assetPrefix` **仅**在 `NEXT_BUILD=1` 时生效。`npm run dev` 不会设置此变量，因此开发模式下没有 `basePath`、没有 `assetPrefix`。**不要手动设置 `output: 'export'`**，否则 HMR 会挂。

### 2. 纯暗色设计系统

项目**没有亮色模式**。`globals.css` 只定义了暗色变量，`colorScheme: "dark"`。虽然 next-themes 启用了切换，但实际只有暗色。新增颜色必须考虑暗色背景对比度。

### 3. Tailwind CSS v4

使用新的 `@import "tailwindcss"` 和 `@plugin` 语法，不是 v3 的 `@tailwind` 指令。PostCSS 插件是 `@tailwindcss/postcss`，不是 `tailwindcss`。自定义主题通过 `@theme {}` 块定义（`--color-ink: #05050a` 等），不要用 `tailwind.config.js`。

### 4. TypeScript 严格模式

`strict: true` + `noUncheckedIndexedAccess`（数组/对象索引访问返回 `T | undefined`）、`noUnusedLocals`、`noUnusedParameters`、`noImplicitOverride`、`noFallthroughCasesInSwitch`。**所有索引访问都需要 undefined 检查**。

### 5. 中文 Slug 处理

博客文章 slug 包含中文。`getPostBySlug()` 内部做了 `decodeURIComponent(slug)`，但 `generateStaticParams` 返回原始 slug。新增 slug 查询时必须一致地对中文做 decodeURIComponent。

文件命名规范：技术缩写应保持大写，例如 `医疗信息化与-HL7-FHIR-标准.md`（非 `hl7-fhir`）。

### 6. 自定义导航加载

`useNavigationLoading` hook（来自 `@/components/UI/NavigationLoading`）负责页面过渡状态。所有 `<Link>` 应调用 `startNavigation` 来触发加载指示器。

### 7. 自定义 Easing 曲线

Tailwind 主题预定义了 `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`、`--ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1)`、`--ease-in-out-circ: cubic-bezier(0.85, 0, 0.15, 1)`。Framer Motion 动画大量使用 `[0.16, 1, 0.3, 1]` 等自定义曲线。

### 8. basePath 双边一致

`process.env.NEXT_BUILD` 没有 `NEXT_PUBLIC_` 前缀，Next.js 不会把它 inline 到客户端 bundle，导致客户端 hydration 时 `BASE_PATH` 退化为 `''`，线上 `<Image src={withBase('/logo.svg')}>` 404。

解决方案：`next.config.ts` 通过 `env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH }` 把 basePath 注入 `NEXT_PUBLIC_BASE_PATH`，Next.js 会 inline 到 SSR + 客户端 bundle 两边。`src/lib/basePath.ts` 读取此变量。

### 9. RSC payload 优化

`getAllPosts()` 已从 `layout.tsx` 移除，文章数据通过 `public/posts-index.json`（~3KB）在 SearchModal 运行时 fetch，避免全量文章数据被序列化进根 layout 的 RSC payload。

### 10. 组件懒加载

非首屏必需的 client 组件通过 `next/dynamic` 懒加载：`CursorGlow`、`ScrollProgress`、`ClickEffect`。避免被打进首屏 chunk 图。

### 11. 文章索引生成时机

`scripts/gen-posts-index.js` 在 `predev` 和 `prebuild` 两个钩子触发。新增/修改文章后，下次 `npm run dev` 或 `npm run build` 自动重新生成 `public/posts-index.json`，SearchModal 即可搜索到新文章。

### 12. `out/` 是构建产物，不要被它误导

`out/` 在 `.gitignore` 中、未被 git 跟踪，是 `npm run build` 的静态导出产物。`out/en/` 等陈旧子树可能是早期英文版 / `[locale]` i18n 路由的构建残留，**源码里已无对应路由**。排查路由时以 `src/app/` 为准，不要把 `out/` 的旧产物当成当前结构。也不要手动清理 `out/`——下次 `build` 会整体覆盖。

### 13. `next.config.ts` 的几个隐式约定

- `images.unoptimized: true`：静态导出无服务端图像优化器，`next/image` 退化为原图直出，新增图片需自行压缩。
- `trailingSlash: true`：所有路由以 `/` 结尾（如 `/posts/xxx/`），`generateStaticParams` 与内部链接拼接都必须遵守，否则线上 404。
- `experimental.optimizePackageImports: ['framer-motion','lucide-react','react-icons']`：让大库按需引入，**不要再自定义 `splitChunks`**——会与 Next 15 SWC 内置 chunk 策略冲突，反而拆出更多碎 chunk。
- `reactStrictMode: true`：开发模式下 effects 会执行两次（mount → unmount → mount），副作用清理逻辑必须幂等。

### 14. 安全头走 `public/_headers`，不在 `next.config.ts` 里配

`output: 'export'` 模式下，`next.config.ts` 的 `headers()` **不会生效**——静态 HTML 由 GitHub Pages 直接返回，不经过 Next。安全响应头（HSTS、X-Frame-Options、Permissions-Policy 等）通过仓库根的 `public/_headers` 配置，Next 静态导出会原样复制到 `out/_headers`，GitHub Pages 会识别。新增响应头改 `public/_headers`，不要改 `next.config.ts`。

### 15. TOC 只提取 h2/h3，标题锚点保留中文

`src/lib/toc.ts` 的 `extractHeadings()` 只匹配 `^#{2,3}\s+`（即 `##` 和 `###`），`#`（h1）和 `####`（h4）不会进目录。生成的 `id` 用正则 `[\w\u4e00-\u9fff\s-]` 过滤，**保留中文字符**，所以中文标题会得到中文锚点（如 `## 章节标题` → `id="章节标题"`）。rehype-slug 在 MDX 渲染侧也会生成 id，两边规则需保持一致。新增需要进目录的标题，必须用 `##` 或 `###`。

### 16. `posts.ts` 的读取层契约

- `'server-only'` 标记：`posts.ts` / `toc.ts` / `types.ts` 顶部都有 `import 'server-only'`，这些 lib **只能在 RSC / Server Component 里调用**，不能 import 进 client 组件。客户端需要文章数据时 fetch `public/posts-index.json`。
- mtime 签名缓存：`getAllPosts()` 用 `computeSignature()`（文件名 + `mtimeMs` 拼接）做缓存键，文件未改动时直接返回内存缓存。**不要在运行时修改 `content/posts/` 下的文件**——签名会变但 SSG 已固化，只能通过重新 `build` 生效。
- `getPostBySlug()` 内部 `decodeURIComponent(slug)` 后再 `find`；`getAdjacentPosts()` 同样 decode。新增 slug 相关查询时保持这个 decode 约定。
- excerpt 兜底：未写 `excerpt` 时取正文前 160 字并 `replace(/[#*`\[\]]/g,'')` 去掉 markdown 符号，注意这个正则会**误删反引号围栏代码块的内容**，含代码开头的文章建议显式写 `excerpt`。

### 17. `package.json` overrides 锁定关键依赖

`overrides` 字段锁定 `postcss: "^8.5.20"` 和 `sharp: "^0.35.3"`。原因：`@tailwindcss/postcss` 依赖的 postcss 版本需稳定，避免 v4 编译管线被 postcss 小版本回归打断；sharp 锁定是为了 `images.unoptimized: true` 场景下依赖树稳定（next 15 的 image pipeline 在 unoptimized 模式下不实际调用 sharp，但 npm install 仍会解析它）。升级 Tailwind v4 或 next 时，要同步检查这两个 override 是否还需要。

## 已清理的历史残留

- ~~`src/app/[locale]/` 空目录树~~ — 废弃 i18n 路由残留，已删除
- ~~`messages/` 空目录~~ — next-intl 残留，已删除
- ~~`CLAUDE.md`~~ — 11 字节冗余引用，已删除
- ~~`OPTIMIZATION_SUMMARY.md`~~ — 描述的组件（ErrorBoundary/Skeletons/PostReader 等）实际不存在，文档与代码脱节，已删除
- ~~`package.json` 冗余 `postbuild` 钩子~~ — `build` 末尾已执行 `pagefind --site out`，已删除
- ~~`content/posts/医疗信息化与-hl7-fhir-标准.md` 文件名大小写~~ — 已重命名为 `医疗信息化与-HL7-FHIR-标准.md`

`scripts/predev.js` + `predev` 钩子保留 — ConsoleNinja VS Code 扩展在用。
