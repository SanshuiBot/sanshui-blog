---
title: MDX 组件嵌入演示
date: 2025-07-17
tags: [教程, MDX]
excerpt: 这篇文章演示了 MDX 的强大能力 — 可以在 Markdown 中直接嵌入 React 组件.
---

# MDX 组件嵌入演示

这篇文章演示了 MDX 的强大能力 — 可以在 Markdown 中直接嵌入 React 组件.

## 普通 Markdown

这是一段普通的 Markdown 内容, 支持所有标准语法:

- **加粗**
- *斜体*
- `行内代码`
- [链接](https://example.com)

## 代码块

```typescript
interface Post {
  slug: string;
  title: string;
}

const post: Post = {
  slug: 'demo',
  title: 'Demo Post',
};
```

## 表格

| 技术 | 用途 |
|------|------|
| Next.js | 框架 |
| MDX | 内容 |
| Tailwind | 样式 |

> 这是一段引用文字, 用来强调某个观点.

## Emoji 和 HTML

可以直接使用 emoji 🎉 和 HTML 标签 `<Ctrl>` + `<K>`.

---

以上就是 MDX 的基础演示. 未来可以在这里嵌入自定义的 React 组件, 比如可交互的代码沙箱, 数据图表, 动态演示等.