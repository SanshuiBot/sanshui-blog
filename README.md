# 三水博客

三水的个人博客，使用现代 Web 技术构建。

## 技术栈

- **框架**: [Next.js](https://nextjs.org/) 16 (App Router)
- **语言**: [TypeScript](https://www.typescriptlang.org/) 5
- **样式**: [Tailwind CSS](https://tailwindcss.com/) v4
- **动画**: [Framer Motion](https://www.framer.com/motion/) 12
- **图标**: [Lucide React](https://lucide.dev/)
- **内容**: Markdown + Gray Matter
- **代码高亮**: highlight.js
- **搜索**: Fuse.js
- **部署**: GitHub Pages

## 功能特性

- ✨ 现代化的响应式设计
- 🌓 深色/浅色模式切换
- 🔍 全文搜索 (Cmd+K)
- 📖 阅读进度条
- 📑 文章目录导航
- 🏷️ 标签系统
- 📡 RSS Feed
- 🗺️ Sitemap 自动生成
- 🔍 SEO 优化 (JSON-LD)
- 📱 移动端适配

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build

# 启动生产服务器
npm run start
```

## 添加文章

在 `content/posts/` 目录下创建 Markdown 文件，文件头格式如下：

```markdown
---
title: 文章标题
date: 2025-01-01
tags: [技术, 教程]
excerpt: 文章摘要
---

文章内容...
```

## 部署

项目使用 GitHub Actions 自动部署到 GitHub Pages。每次推送 `master` 分支都会触发自动构建和部署。

## 许可

MIT