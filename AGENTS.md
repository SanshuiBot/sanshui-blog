<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 三水博客 — 项目指南

## 构建命令

| 命令 | 作用 | 注意事项 |
|------|------|----------|
| `npm run dev` | 开发服务器 | `predev` 自动生成 `.next/routes-manifest.json`（ConsoleNinja 兼容） |
| `npm run build` | 生产构建 | 静态导出 + Pagefind 搜索索引；设置 `NEXT_BUILD=1` 环境变量 |
| `npm run lint` | ESLint 检查 | ESLint v9 flat config |
| `npm run format` | Prettier 格式化 | 配置见 `.prettierrc` |

## 架构要点

- **全静态博客** — 无 API 路由，所有数据在构建时从文件系统读取
- **内容驱动** — `content/posts/` 下的 `.md` 文件，gray-matter frontmatter 解析。文件名即为 slug（含中文）
- **MDX 渲染** — `next-mdx-remote/rsc`，插件链：remark-gfm → rehype-slug → rehype-highlight
- **客户端提供者** — `Provider.tsx` 包裹：next-themes、CursorGlow、ScrollProgress、Navbar、Footer
- **路径别名** — `@/*` → `./src/*`
- **Pagefind** — `postbuild` 阶段对 `out/` 生成搜索索引

## ⚠️ 关键陷阱

### 1. 静态导出通过环境变量切换
`next.config.ts` 中 `output: 'export'`、`basePath`、`assetPrefix` **仅**在 `NEXT_BUILD=1` 时生效。`npm run dev` 不会设置此变量，因此开发模式下没有 `basePath`、没有 `assetPrefix`。**不要手动设置 `output: 'export'`**，否则 HMR 会挂。

### 2. 纯暗色设计系统
项目**没有亮色模式**。`globals.css` 只定义了暗色变量，`colorScheme: "dark"`。虽然 next-themes 启用了切换，但实际只有暗色。新增颜色必须考虑暗色背景对比度。

### 3. Tailwind CSS v4
使用新的 `@import "tailwindcss"` 和 `@plugin` 语法，不是 v3 的 `@tailwind` 指令。PostCSS 插件是 `@tailwindcss/postcss`，不是 `tailwindcss`。自定义主题通过 `@theme {}` 块定义（`--color-ink: #05050a` 等），不要用 `tailwind.config.js`。

### 4. TypeScript 严格模式
`strict: true` + `noUncheckedIndexedAccess`（数组/对象索引访问返回 `T | undefined`）、`noUnusedLocals`、`noUnusedParameters`。**所有索引访问都需要 undefined 检查**。

### 5. 中文 Slug 处理
博客文章 slug 包含中文。`getPostBySlug()` 内部做了 `decodeURIComponent(slug)`，但`generateStaticParams` 返回原始 slug。新增 slug 查询时必须一致地对中文做 decodeURIComponent。

### 6. 自定义导航加载
`useNavigationLoading` hook（来自 `@/components/UI/NavigationLoading`）负责页面过渡状态。所有 `<Link>` 应调用 `startNavigation` 来触发加载指示器。

### 7. 自定义 Easing 曲线
Tailwind 主题预定义了 `--ease-out-expo`、`--ease-out-back`、`--ease-in-out-circ`，Framer Motion 动画大量使用 `[0.16, 1, 0.3, 1]` 等自定义曲线。
