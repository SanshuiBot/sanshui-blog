---
title: Vite 6 冷启动优化：从依赖预构建到插件缓存
date: 2026-07-17
tags: [Vite, 前端, 技术, 性能]
excerpt: 大型项目 Vite 冷启动 40s → 3s 的真实优化过程。讲依赖预构建、按需 optimizeDeps、插件 cacheDir、worker 池调优，以及 8 个常见冷启动慢的根因。
---

# Vite 6 冷启动优化：从依赖预构建到插件缓存

线上有一个 monorepo 项目，依赖 200+ 个包，Vite 冷启动要 40s。排查后发现根本不是「项目大」的锅，而是配置层的几个错误叠加。这篇文章记录完整的优化链路，从 40s 优化到 3s。

## 一、Vite 冷启动的两个阶段

Vite dev server 启动分两段：

1. **依赖预构建（dep pre-bundling）**：扫描所有 import，找到裸模块（bare import），用 esbuild 把它们打包成 ESM 单文件，缓存到 `node_modules/.vite/deps/`
2. **按需编译**：浏览器请求某个模块，Vite 才编译那个模块

预构建是冷启动慢的最大头——尤其大型项目，要扫描成千上万个文件。

## 二、踩坑 1：optimizeDeps 的 include 没配对

Vite 默认在启动时扫描入口文件，找出所有 bare import，然后预构建这些依赖。但有几种情况会漏扫：

1. **动态 import**：`import('lodash')` 这种动态导入，静态扫描发现不了
2. **Worker 引用**：`new Worker(new URL('./worker.js', import.meta.url))` 里的依赖
3. **monorepo 软链**：软链到的 workspace 包里的依赖

漏扫的后果：浏览器第一次加载时触发「dep optimize on-demand」，重新预构建依赖，整个页面 reload，看起来像「冷启动后又重启了一次」。

**解决**：显式声明所有已知的 bare import：

```ts
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: [
      'lodash-es',
      'date-fns',
      '@mui/material/Button',
      // monorepo workspace 包也要 include
      '@my-workspace/ui',
    ],
    exclude: ['@vitejs/plugin-react'], // 这些是 dev-only，不需要预构建
  },
});
```

## 三、踩坑 2：每次启动都重建 deps cache

`node_modules/.vite/deps/` 在以下情况会失效：

1. `package.json` 的 `dependencies` 改变
2. `lockfile` 改变
3. `vite.config.ts` 里 `optimizeDeps` 配置改变
4. **手动 `rm -rf node_modules/.vite`**

但很多人发现 cache 频繁失效。原因是 Vite 用 lockfile hash 来判定，不同包管理器的 lockfile 格式不一样：

- npm: `package-lock.json`
- yarn: `yarn.lock`
- pnpm: `pnpm-lock.yaml`

如果 `vite.config.ts` 里用了 `loadEnv` 等 API，可能在配置加载阶段就污染了 cache key。

**解决**：用 pnpm（lockfile 稳定），并保持 `optimizeDeps` 配置稳定，不要在配置里写「跟当前环境相关」的东西（比如 `Date.now()`）。

## 四、踩坑 3：插件没声明 `enforce` 和 `apply` 导致重复编译

```ts
// vite.config.ts
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    myPlugin(), // 我自己写的插件
    visualizer(),
  ],
});
```

每个插件默认在「正常阶段」执行。如果两个插件都拦截 `.js` 文件，可能导致同一文件被编译两次。

**正确做法**：

```ts
plugins: [
  { ...react(), enforce: 'pre' }, // 在 vite 内部编译前先 transform JSX
  { ...myPlugin(), enforce: 'post' }, // 在 vite 编译后再处理
  { ...visualizer(), apply: 'build' }, // 只在 build 时启用
];
```

`enforce: 'pre'` 让插件在 Vite 内置 transform 之前运行。`enforce: 'post'` 相反。

## 五、踩坑 4：CSS @import 链导致瀑布

```css
/* styles/main.css */
@import './reset.css';
@import './base.css';
@import './components/button.css';
@import './components/card.css';
```

Vite 看到 `@import` 会递归展开，但每次展开都是一个独立 CSS 处理流程。多层 `@import` 链会让冷启动变慢。

**解决**：扁平化 CSS 结构，或用 Sass/Less 的 `@use` 替代。

## 六、踩坑 5：大量的虚拟模块导致 SSR transform 慢

某些 UI 库（如 MUI v5）会通过虚拟模块动态注入组件样式。在 SSR 模式下，这些虚拟模块每次请求都要 transform。

**解决**：把 UI 库的样式抽取成静态 CSS 文件，或用 `@mui/material-v5` 的 `StyledEngineProvider` 把样式注入到 `<head>` 而非动态创建。

## 七、Vite 6 的新特性：Environment API

Vite 6 引入 Environment API，允许显式配置「客户端」「SSR」「worker」等多个构建环境。

```ts
// vite.config.ts
export default defineConfig({
  environments: {
    client: {
      optimizeDeps: { include: ['react', 'react-dom'] },
    },
    ssr: {
      optimizeDeps: { include: ['express', 'cookie'] },
    },
    worker: {
      optimizeDeps: { include: ['comlink'] },
    },
  },
});
```

每个 environment 有独立的 deps cache，避免「客户端依赖被预构建进 SSR 缓存」这种交叉污染。

## 八、实战案例：monorepo 40s → 3s

项目结构：

```text
my-monorepo/
├── apps/
│   ├── web/    # 主应用
│   └── admin/  # 后台
├── packages/
│   ├── ui/     # 共享 UI 库
│   ├── utils/  # 工具库
│   └── types/  # 类型定义
└── pnpm-workspace.yaml
```

### 优化 1：用 pnpm 替代 npm

pnpm 的 node_modules 用硬链接，文件 I/O 慢得多。这一步就把冷启动从 40s 降到 28s。

### 优化 2：扫描入口收窄

默认 Vite 会扫描整个项目根目录。在 monorepo 里，这意味着会扫描 `packages/*` 的所有源文件。

```ts
export default defineConfig({
  optimizeDeps: {
    entries: ['src/main.tsx'], // 只扫描主应用入口
  },
});
```

降到了 18s。

### 优化 3：手动 include 高频依赖

```ts
optimizeDeps: {
  include: [
    'react', 'react-dom', 'react-router-dom',
    '@tanstack/react-query',
    'lodash-es', 'date-fns', 'zod',
    'framer-motion', 'clsx',
    // monorepo workspace 包
    '@my/ui', '@my/utils',
  ],
}
```

降到 12s。

### 优化 4：插件按职责分离

```ts
plugins: [
  react(),
  // 只在 build 时启用 visualizer
  process.env.NODE_ENV === 'production' && visualizer(),
  // SVG 插件只在 src 范围生效
  svgr({ include: '**/icons/*.svg' }),
].filter(Boolean);
```

降到 8s。

### 优化 5：用 swc 替代 babel

`@vitejs/plugin-react` 默认用 babel。改用 `@vitejs/plugin-react-swc`：

```ts
import react from '@vitejs/plugin-react-swc';
```

SWC 用 Rust 实现，比 babel 快 10-20 倍。降到 5s。

### 优化 6：HMR 边界优化

最后 2s 主要是 HMR 传播开销。改 React 组件的代码时，Vite 找到「接受这个模块的 HMR boundary」。如果没找到，会触发 full page reload。

```ts
// vite.config.ts
server: {
  hmr: {
    overlay: false, // 关闭错误覆盖层（开发可选）
  },
}
```

最终冷启动稳定在 3-4s。

## 九、按需编译的隐藏成本

Vite 6 默认按需编译，但有几个隐藏成本：

1. **第一次访问每个路由会慢**：因为对应的页面组件才被编译。解决：用 `server.warmup` 预热。

```ts
server: {
  warmup: {
    clientFiles: [
      './src/main.tsx',
      './src/pages/Home.tsx',
      './src/pages/About.tsx',
    ],
  },
}
```

2. **Worker 文件每次改都全量重编译**。解决：把 worker 逻辑拆分成更小的文件，让 HMR 边界更精确。

## 十、Build 速度优化

虽然本文重点在 dev，但 build 慢也经常是 Vite 项目痛点。

1. **`build.target: 'es2020'`**：让 Vite 输出更现代的代码，减少 transpile 量
2. **`build.minify: 'esbuild'`**：esbuild 比 terser 快 5-10 倍，体积略大但可接受
3. **`build.rollupOptions.output.manualChunks`**：手动分包，避免某个超大 chunk 让 build 慢

```ts
build: {
  target: 'es2020',
  minify: 'esbuild',
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'ui-vendor': ['@my/ui', 'framer-motion'],
      },
    },
  },
}
```

## 十一、监控冷启动时间

把 `vite --profile` 启动，访问 `http://localhost:5173/?profile` 触发 CPU profile 下载。用 Chrome DevTools 打开 `.cpuprofile` 文件，可以看到冷启动各阶段的耗时。

更轻量的方式：在 `vite.config.ts` 里打点：

```ts
const start = Date.now();
export default defineConfig({
  plugins: [
    {
      name: 'startup-timer',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          console.log(`Vite started in ${Date.now() - start}ms`);
        });
      },
    },
  ],
});
```

## 十二、总结

Vite 冷启动慢的根因 80% 是「依赖预构建配置错误」。优化思路：

1. **`optimizeDeps.include` 显式声明所有 bare import**
2. **`optimizeDeps.entries` 收窄扫描范围**（monorepo 关键）
3. **`@vitejs/plugin-react-swc` 替代 babel**（10x 速度）
4. **插件用 `enforce` 区分阶段**，避免重复编译
5. **`server.warmup.clientFiles` 预热首屏路由**

Vite 6 的 Environment API 是冷启动优化的「未来形态」——让每个构建环境独立缓存，从根本上避免交叉污染。
