---
title: Tailwind CSS v4 迁移实战：从 config 到 CSS-first
date: 2026-07-19
tags: [Tailwind, CSS, 前端, 技术]
excerpt: Tailwind v4 把配置从 JS 搬到 CSS。本文讲 @theme 令牌、@plugin、@custom-variant、@apply 的语义变化，再到 6 个真实迁移踩坑点。
---

# Tailwind CSS v4 迁移实战：从 config 到 CSS-first

Tailwind CSS v4 在 2025 年初正式发布。最大变化是「CSS-first configuration」——`tailwind.config.js` 被 `@theme` 等 CSS 指令取代。但迁移不是「把 JS 翻译成 CSS」那么简单，有好几个语义坑。这篇文章记录完整迁移过程。

## 一、v3 vs v4 配置方式对比

### v3 方式

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: '#1c1917',
        accent: '#a855f7',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
```

```css
/* styles.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### v4 方式

```css
/* styles.css */
@import 'tailwindcss';

@plugin "@tailwindcss/typography";

@theme {
  --color-ink: #1c1917;
  --color-accent: #a855f7;
  --font-sans: 'Inter', sans-serif;
}
```

**没有 `tailwind.config.js` 了**——所有配置都在 CSS 里。

## 二、@theme 的命名空间规则

`@theme` 内的变量名遵循「命名空间 + 名称」格式，前缀决定生成的 utility 类：

| 变量前缀         | 生成的 utility                 |
| ---------------- | ------------------------------ |
| `--color-*`      | `bg-*` / `text-*` / `border-*` |
| `--font-*`       | `font-*`                       |
| `--spacing-*`    | `p-*` / `m-*` / `gap-*`        |
| `--breakpoint-*` | `sm:` / `md:` / ...            |
| `--radius-*`     | `rounded-*`                    |
| `--ease-*`       | `ease-*`                       |
| `--animate-*`    | `animate-*`                    |

```css
@theme {
  --color-accent-violet: #a855f7; /* → bg-accent-violet */
  --color-accent-pink: #ec4899; /* → text-accent-pink */
  --font-mono: 'JetBrains Mono', monospace; /* → font-mono */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1); /* → ease-out-expo */
}
```

## 三、踩坑 1：PostCSS 插件变了

v3：

```js
// postcss.config.js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

v4：

```js
// postcss.config.mjs
export default { plugins: { '@tailwindcss/postcss': {} } };
```

**没有 autoprefixer 了**——v4 内置自动加前缀。如果还配置 autoprefixer 会报重复处理警告。

## 四、踩坑 2：@apply 的语义变化

v3 里 `@apply` 会内联对应的 CSS，可以应用到任意选择器。

v4 里 `@apply` 默认只能应用 Tailwind 的标准 utilities。如果你想 `@apply` 自定义 utility，需要先把它定义为 utility：

```css
/* ❌ v4 报错：unknown utility class */
.custom-hover {
  @apply group-hover/link:text-accent-violet;
}

/* ✅ 用 @utility 定义自定义 utility */
@utility group-hover/link\:text-accent-violet {
  /* ... */
}
```

但实际上 v4 大部分场景用原生 CSS 写就行，不一定非要 `@apply`。

## 五、踩坑 3：@layer 的层级变化

v3 的 `@layer` 是 PostCSS 提供的层级管理工具。

v4 改为基于浏览器原生 `@layer`，并预定义了几个层级：

```css
@layer theme, base, components, utilities;

@layer base {
  body {
    @apply bg-white;
  }
}

@layer utilities {
  .glass {
    /* ... */
  }
}
```

**关键**：如果 v4 里某个 utility 类被裸 CSS（不在 `@layer`）覆盖，**裸 CSS 优先级更高**。这是 v4 的常见坑——亮色模式覆盖规则写成了裸 CSS，导致 Tailwind utility hover 失效。

## 六、踩坑 4：variant 优先级与 @custom-variant

v3 里写自定义 variant：

```js
// tailwind.config.js
module.exports = {
  variants: {
    extend: { backgroundColor: ['checked'] },
  },
};
```

v4 改用 `@custom-variant`：

```css
@custom-variant checked (&:checked);
```

然后用 `checked:bg-blue-500` 之类的 utility。

## 七、踩坑 5：JIT 模式下动态类名

v3 已经是 JIT，但仍允许在 `safelist` 里写动态类名：

```js
module.exports = {
  safelist: ['bg-red-500', 'bg-blue-500'],
};
```

v4 移除了 `safelist`。改为 `@source inline(...)`：

```css
@source inline("bg-red-500 bg-blue-500");
```

但实际上 v4 的 JIT 扫描更智能，大部分场景不需要显式 safelist。

## 八、迁移实战：sanshui-blog 的 v3 → v4 升级

### 第一步：删除 `tailwind.config.js`

```bash
rm tailwind.config.js
```

### 第二步：更新 `postcss.config.mjs`

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

### 第三步：迁移 `globals.css`

v3：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
  }
}
```

v4：

```css
@import 'tailwindcss';

@theme {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(0 0% 3.9%);
  --color-primary: hsl(0 0% 9%);
  /* ... 其他颜色 */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

@layer base {
  :root {
    --background: 0 0% 100%;
  }
}
```

### 第四步：迁移 plugin 配置

v3：

```js
plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')];
```

v4：

```css
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms";
```

### 第五步：处理 `content` 配置

v3 需要显式声明扫描路径：

```js
content: ['./src/**/*.{ts,tsx}'];
```

v4 自动扫描项目内所有源文件，**不需要 content 配置**。

但如果有些文件在 `node_modules` 或 git ignored 路径下，需要 `@source`：

```css
@source "../node_modules/my-lib/dist/**/*.js";
```

## 九、踩坑 6：`@tailwindcss/typography` 的 `prose` 不再自动注入

v3 装 `@tailwindcss/typography` 后 `prose` 类即可用。

v4 需要 `@plugin` 显式引入：

```css
@plugin "@tailwindcss/typography";
```

否则 `prose` 类无效。

## 十、自定义颜色：v4 的透明度修饰符

v3 自定义颜色支持 `bg-accent/50` 透明度修饰符，但需要颜色定义是 RGB 三元组或 HSL。

v4 推荐 CSS 变量直接用现代颜色函数：

```css
@theme {
  --color-accent-violet: oklch(0.6 0.25 290);
  --color-accent-pink: oklch(0.7 0.25 0);
}
```

然后 `bg-accent-violet/50` 自动生成 `color-mix(in oklab, var(--color-accent-violet) 50%, transparent)`。

**优点**：oklch 色彩空间感知更均匀，调色更自然。

## 十一、迁移踩坑：CSS 变量定义位置

v3 经常把 CSS 变量定义在 `:root` 里，配合 Tailwind utility 使用：

```css
:root {
  --background: 0 0% 100%;
}

/* tailwind.config.js */
colors: {
  background: 'hsl(var(--background))';
}
```

v4 推荐直接在 `@theme` 里定义：

```css
@theme {
  --color-background: hsl(0 0% 100%);
}
```

`@theme` 会自动把变量也注入到 `:root`，并生成对应的 utility。

## 十二、@utility：定义自定义 utility

v3 自定义 utility 通常写在 `@layer utilities`：

```css
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

v4 推荐 `@utility` 指令：

```css
@utility text-balance {
  text-wrap: balance;
}
```

`@utility` 支持 variant：

```css
@utility text-balance {
  text-wrap: balance;
}

/* 自动生成：hover:text-balance、md:text-balance 等 */
```

## 十三、对比：迁移前后 bundle 大小

```
v3 CSS 产物：58.2 KB
v4 CSS 产物：43.1 KB（gzip 后 8.7 KB）
```

v4 JIT 扫描更精确，未使用的 utility 不会被生成。这也是 v4 比 v3 快 5x 的原因之一。

## 十四、踩坑 7：v4 与 v3 不能混用

如果你的项目里有多个 CSS 入口，**所有入口都要升级到 v4**，否则 v4 的 `@import 'tailwindcss'` 会把 v3 的 `@tailwind base` 当成未知指令。

## 十五、总结

v4 迁移的核心要点：

1. **CSS-first 配置**：`tailwind.config.js` → `@theme` / `@plugin` / `@utility`
2. **PostCSS 插件换名**：`tailwindcss` → `@tailwindcss/postcss`，移除 autoprefixer
3. **`@apply` 不能用自定义 utility**：改用 `@utility` 注册
4. **`@layer` 是浏览器原生**：裸 CSS 优先级高于 `@layer` 内规则
5. **颜色用 oklch**：感知均匀，配合 `bg-x/50` 自动 `color-mix`

v4 的设计哲学是「让 CSS 回归 CSS」——Tailwind 不再是一个「编译器魔法」，而是一组标准化的 CSS 指令。这让调试更容易，也让 IDE 自动补全更准。
