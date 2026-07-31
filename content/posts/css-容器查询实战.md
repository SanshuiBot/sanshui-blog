---
title: CSS 容器查询实战：从媒体查询到组件级响应式
date: 2026-07-31
tags: [CSS, 前端, 技术]
excerpt: 媒体查询基于视口，容器查询基于父容器。本文从 @container 语法讲到 polyfill 兼容方案，再给出 6 个真实组件的容器查询改造案例。
---

# CSS 容器查询实战：从媒体查询到组件级响应式

容器查询（Container Queries）在 2023 年正式进入所有主流浏览器。但两年过去了，我看到的真实生产代码里用它的依然不多——很多人知道语法，但不知道什么场景下该用容器查询替代媒体查询。这篇文章会从最基础的语法讲到 6 个真实组件的改造案例。

## 一、为什么媒体查询不够用

媒体查询的问题在于：**它基于视口尺寸，而不是组件所在容器的尺寸**。

考虑一个 Card 组件，它同时被用在两个地方：

1. 首页 Hero 旁边的右栏，容器宽度 300px
2. 文章列表的主区域，容器宽度 800px

用媒体查询写：

```css
.card { display: flex; flex-direction: column; }
@media (min-width: 768px) {
  .card { flex-direction: row; }
}
```

问题：用户在 iPad 上看，视口 768px，两个地方的 Card 都变成 row 布局。但右栏只有 300px 宽，row 布局把图片挤成 100×50 的缩略图，丑得没法看。

容器查询要解决的就是这个：**让组件根据自己父容器的尺寸调整布局，而不是根据整个视口**。

## 二、@container 语法三步走

```css
/* 第一步：声明一个容器 */
.card-wrapper {
  container-type: inline-size; /* 横向尺寸作为容器查询的依据 */
  container-name: card;        /* 可选，给容器起个名字 */
}

/* 第二步：用 @container 写查询 */
@container card (min-width: 500px) {
  .card {
    flex-direction: row;
  }
}

/* 第三步：组件内部样式照常 */
.card { ... }
```

关键概念：

- `container-type: inline-size` —— 以 inline 方向（通常是横向）的尺寸作为查询依据。这是最常用的，因为大多数响应式布局关心的是宽度。
- `container-type: size` —— 同时考虑 width 和 height，但会让容器脱离正常文档流计算，慎用。
- `container-name` —— 给容器起名，避免多个容器查询互相干扰。

## 三、踩坑 1：container-type 会影响子元素的尺寸计算

```css
.sidebar {
  container-type: inline-size;
  width: 300px;
}
.sidebar > .content {
  width: 100%; /* 这里的 100% 是相对于 .sidebar 的 content-box */
}
```

这看起来没问题。但如果你把 `container-type` 设成 `size`，子元素的 `width: 100%` 会变成相对于**容器自身**，导致循环依赖。**这就是为什么 90% 的场景应该用 `inline-size` 而不是 `size`**。

## 四、踩坑 2：容器内的 fixed 定位会「失效」

```css
.modal-wrapper {
  container-type: inline-size;
}
.modal-wrapper .modal {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
}
```

直觉上 `position: fixed` 应该相对视口定位。但如果某个祖先元素有 `transform` / `filter` / `will-change` / `container-type: size`（注意 `inline-size` 不在此列）等属性，fixed 会变成相对于那个祖先定位。

**`container-type: size` 会触发 containing block 改变**，`container-type: inline-size` 不会。所以**优先用 `inline-size`**，除非你真的需要查询高度。

## 五、踩坑 3：容器查询里的 vh/vw 单位语义没变

```css
@container (min-width: 500px) {
  .hero { height: 80vh; }
}
```

`vh` / `vw` 依然是视口单位，**不会**因为你在容器查询里就变成容器单位。如果你想用容器的高度，得用 `cqh`（容器高度百分比）、`cqw`（容器宽度百分比）、`cqi`（容器 inline 尺寸百分比）等容器单位。

```css
.hero { height: 80cqh; } /* 容器高度的 80% */
```

## 六、实战案例 1：Card 组件三态布局

```html
<div class="card-grid">
  <div class="card-wrapper">
    <article class="card">
      <img class="card-image" src="..." />
      <div class="card-body">
        <h3>文章标题</h3>
        <p>摘要...</p>
      </div>
    </article>
  </div>
</div>
```

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card-wrapper {
  container-type: inline-size;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

/* 容器宽度大于 500px：横向布局，图片在左 */
@container (min-width: 500px) {
  .card {
    flex-direction: row;
    align-items: center;
  }
  .card-image {
    width: 200px;
    height: 200px;
    flex-shrink: 0;
  }
}

/* 容器宽度大于 700px：图片变大，标题字号增加 */
@container (min-width: 700px) {
  .card-image {
    width: 280px;
    height: 280px;
  }
  .card-body h3 {
    font-size: 1.5rem;
  }
}
```

效果：同一个 Card 组件放在窄栏（300px）时是纵向小图布局，放在主区（800px）时是横向大图布局，**完全由容器尺寸驱动**，与视口无关。

## 七、实战案例 2：Navigation 自动横竖切换

```css
.nav-wrapper {
  container-type: inline-size;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@container (min-width: 600px) {
  .nav-list {
    flex-direction: row;
    justify-content: space-around;
  }
}
```

把导航放在 sidebar 时容器窄，纵向；放在 header 时容器宽，横向。一个组件代码搞定两种场景。

## 八、实战案例 3：Table 在窄容器退化为卡片

数据表格在窄屏下挤成一团。传统方案是 `overflow-x: auto`，但用户体验差。用容器查询可以让表格在窄容器自动变成卡片列表：

```css
.table-wrapper {
  container-type: inline-size;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

@container (max-width: 600px) {
  .data-table thead {
    display: none;
  }
  .data-table tr {
    display: block;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
  }
  .data-table td {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
  }
  .data-table td::before {
    content: attr(data-label);
    font-weight: bold;
    margin-right: 1rem;
  }
}
```

HTML 里每个 `td` 加 `data-label` 属性：

```html
<td data-label="姓名">张三</td>
```

这样窄容器下每行变成卡片，左 label 右值。

## 九、实战案例 4：Hero 区背景图随容器尺寸切换

```css
.hero-wrapper {
  container-type: inline-size;
}

.hero-bg {
  background-image: url('/hero-mobile.jpg');
  background-size: cover;
}

@container (min-width: 768px) {
  .hero-bg {
    background-image: url('/hero-desktop.jpg');
  }
}
```

视口宽度变化时，容器宽度也跟着变，自动切换合适的图片。比媒体查询更精准——比如把 Hero 嵌入一个 Dialog 里，容器宽度只有 400px，即使视口是 1920px 也会用 mobile 版本。

## 十、实战案例 5：Side-by-side Editor 在窄容器堆叠

代码编辑器组件默认左右分栏（代码 + 预览）。窄容器下自动堆叠：

```css
.editor-wrapper {
  container-type: inline-size;
}

.editor-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@container (max-width: 800px) {
  .editor-split {
    grid-template-columns: 1fr;
  }
}
```

## 十一、实战案例 6：Sidebar 折叠按钮的容器查询 + prefers-reduced-motion

```css
.sidebar-wrapper {
  container-type: inline-size;
}

.sidebar {
  transition: width 0.3s ease;
}

@container (max-width: 200px) {
  .sidebar-label {
    display: none;
  }
  .sidebar-icon {
    margin: 0 auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar {
    transition: none;
  }
}
```

容器查询和媒体查询可以共存——容器查询管布局，媒体查询管偏好。

## 十二、兼容性方案

容器查询在 2023 年后所有主流浏览器都原生支持。但如果你要支持更老的浏览器，有两条路：

**方案 A：CSS 容器查询 polyfill**

```html
<script src="https://cdn.jsdelivr.net/npm/container-query-polyfill@1.0.2/dist/cqfill.min.js"></script>
```

**方案 B：渐进增强**

```css
/* 老浏览器：媒体查询兜底 */
@media (min-width: 768px) {
  .card { flex-direction: row; }
}

/* 新浏览器：容器查询覆盖 */
@supports (container-type: inline-size) {
  .card-wrapper { container-type: inline-size; }
  .card { flex-direction: column; }
  @container (min-width: 500px) {
    .card { flex-direction: row; }
  }
}
```

`@supports` 检测原生支持，如果有就覆盖媒体查询的样式。

## 十三、容器查询与 Subgrid 的配合

容器查询解决「组件根据容器尺寸切换布局」，Subgrid 解决「子元素继承父元素的网格轨道」。两者结合可以让嵌套组件的列对齐完美：

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.card-wrapper {
  container-type: inline-size;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

@container (min-width: 500px) {
  .card-wrapper {
    grid-template-columns: 200px 1fr;
    grid-template-rows: auto;
  }
  .card-image { grid-column: 1; }
  .card-body { grid-column: 2; }
}
```

## 十四、总结

容器查询不是媒体查询的替代品，而是补充：

- **视口级布局变化**：用媒体查询（Hero 区在不同视口尺寸下的布局）
- **组件级布局变化**：用容器查询（同一个组件在不同容器宽度下的布局）

记住三件事：

1. `container-type: inline-size` 是 90% 场景的选择
2. 容器查询里的 `vh` / `vw` 依然是视口单位，容器单位是 `cqh` / `cqw` / `cqi`
3. 老浏览器用 `@supports` 渐进增强

容器查询让组件真正变成了可复用的「独立单元」——它不关心自己被放在哪里，只关心父容器给了它多大的空间。这是响应式设计的下一步进化。
