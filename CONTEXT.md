# sanshui-blog

三水的个人博客。Next.js 16 纯静态导出（App Router + `output: 'export'`），托管 GitHub Pages，basePath `/sanshui-blog`。「Aurora 玻璃态」设计系统，亮色为主、暗色可选。

本文件是项目 glossary——只收本项目独有的术语，不收通用编程概念。每个词给出**它是什么**（不是它做什么），并标 _避免_ 同义词。约定与命令见 `AGENTS.md`，架构决策见 `docs/adr/`。

## Language

**thumb 几何**: TOC 滚动指示条（`.toc-thumb`）的高度与位置——按「可滚比例」从视口/总高/scrollTop 算出的 `{ top, height }`。副产物是「内容不超出视口时返回 `null`（无需浮层）」。由纯函数 `thumbGeometry` 持有不变量（24px 高度下限、不越视口边界），由 `useScrollThumbGeometry` hook 持有「何时重算」的副作用编排。 _避免_: 滚动条几何、指示条位置

**locality 断裂**: 纯函数与其副作用编排分居两模块时——测试集中在纯函数上（不变量有测），而真正的 bug 表面（何时调用、清理、竞态）在无测的编排层。删一个不会集中另一个的复杂度时即断裂。 _避免_: 测试盲区、副作用泄漏（后者是结果不是断裂本身）

**scroll container ref**: 一个其内容可滚的容器 DOM 节点的 React ref，`useScrollThumbGeometry` 唯一输入。ref 必须指向「`overflow-y: auto` 且内容可能超出」的节点（TOC 里是 `.toc-scroll`）。 _避免_: 滚动父级、可滚元素

**FOUC**: First Content FOUC——首屏前主题/accent 闪烁。本项目通过 inline `<head>` script（`accentBootstrapScript`）同步读 localStorage 写 CSS 变量来防。FOUC 闪屏的具体形态见 ADR-0001 的「不靠浏览器实现细节」收尾。

## Decisions

见 `docs/adr/`。每条 ADR 记一次架构决策及其「为什么这么选」——未来探索者会想知道的门槛。
