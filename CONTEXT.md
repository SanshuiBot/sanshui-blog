# sanshui-blog

三水个人博客：Next.js 16 纯静态导出（App Router + `output:'export'`），GitHub Pages basePath `/sanshui-blog`，「Aurora 玻璃态」，亮色为主、暗色可选。本文件是术语表——只收本项目独有术语，说明「它是什么」（不是它做什么），并标 _避免_ 同义词。约定见 `AGENTS.md`，架构决策见 `docs/adr/`。

## 主题与动效

**FOUC**: 首屏前主题/accent 闪烁。由 layout `<head>` 内联 `accentBootstrapScript` 同步读 localStorage 写 CSS 变量防住。 _Avoid_: 闪屏

**accent 解析器**: 「localStorage → 6 个 accent CSS 变量」的解析逻辑，三条消费者路径——`resolveAccentColors`（纯函数真相源）/ `accentBootstrapScript`（inline 副本）/ `getCustomPreset`（AccentPicker 读自定义预设）。三者校验等级必须一致（ADR-0002），否则重现混合调色盘 FOUC。 _Avoid_: accent 解析、调色盘逻辑

**reduced-motion 共享 hook**: `UI/usePrefersReducedMotion`——封装 matchMedia + `useSyncExternalStore`（客户端实时 / SSR 固定 false），AmbientEffects / ScrollProgress / Footer / HeroParallax 共用；替代 framer `useReducedMotion`（dev 下打 warnOnce 噪音）。 _Avoid_: reduced-motion 检测、matchMedia 订阅

**framer 自动降级关闭**: `Providers.tsx` 的 `<MotionConfig reducedMotion="never">`——动效自管 reduced-motion（CSS 0.01ms + AmbientEffects 阀门 + 共享 hook），不依赖 framer 自动检测降级，顺带静默 VisualElement warnOnce。 _Avoid_: MotionConfig 配置

**功能性 vs 装饰性动画**: reduced-motion 政策核心二分。功能性（滚动淡出 scrollY→opacity）必须保留——reduced 用户也要「滚动后首屏隐藏」；装饰性（视差/入场/循环）才跳过。Hero 曾全关导致首屏永不消失（bug 根因）。 _Avoid_: 全部跳过

**卡片跟手流式渲染**: 文章列表（首页/归档/标签页）骨架→卡片逐张揭示的实现——骨架层与卡片层 absolute 同挂一 `h-60` 容器、opacity 同帧反向过渡（零空白帧）；卡片入场 = scale spring 0.88→1（`cardPop`）+ opacity tween 0.28s（`cardReveal`），骨架错峰 `min(i×45, 675)`ms。收口 `PostGrid`/`PostCard`。 _Avoid_: 卡片浮现动画、流式加载

**主题色同步**: `ThemeColorSync`——监听 resolvedTheme 动态改 `<meta name="theme-color">`（暗 `#05050a` / 亮 `#fafaf9`）；配合 `viewport.colorScheme: 'light dark'` + `color-scheme` 让原生滚动条/表单控件跟随主题。 _Avoid_: theme-color 同步、地址栏颜色

## 目录（TOC）

**thumb 几何**: `.toc-thumb` 指示条按可滚比例算出的 `{ top, height }`（内容不溢出返回 null）。不变量（24px 下限、不越界）由纯函数 `thumbGeometry` 持有，何时重算由 `useScrollThumbGeometry` 编排。 _Avoid_: 滚动条几何、指示条位置

**locality 断裂**: 纯函数与其副作用编排分居两模块时的结构问题——测试集中在纯函数，而真 bug（何时调用/清理/竞态）在无测的编排层。 _Avoid_: 测试盲区

**scroll container ref**: `useScrollThumbGeometry` 唯一输入——指向「`overflow-y: auto` 且内容可能超出」的节点（TOC 里是 `.toc-scroll`）。 _Avoid_: 滚动父级、可滚元素

## 搜索

**文章索引条目**: SearchModal fetch 的轻量索引形状 `{ slug, title, date, excerpt, tags }`（~10KB，剔除 content/readingTime 避免全量数据进 RSC payload）。真相源 `lib/post-index.ts` 的 `PostIndexEntry`（client-safe），由 `toIndexEntry` 从完整 Post 投影。 _Avoid_: SearchPost、索引形状

**搜索词元**: `tokenize(query)` 输出——按空白切的小写词元数组。多关键词 AND：每个词元都要命中 title/excerpt/tags 拼的 haystack（`lib/search.ts` 纯函数，`tests/search.test.ts` 有契约测试）。 _Avoid_: 关键词、query 分词

**高亮片段**: `splitByTerms` 返回的 `{ text, hit }[]`，hit 段渲染 `<mark className="search-mark">`；大小写不敏感、原样保留大小写，拼回不丢字符。 _Avoid_: 搜索结果高亮

## 交互收口

**卸载后 setState**: 组件卸载后定时器回调 setState 的 bug 类。由 `useSafeTimeout`（ADR-0003）hook 层统一管 timer + cleanup，调用方不手写「ref + cleanup」仪式。 _Avoid_: timer 泄漏

**滚动锁收口**: `useScrollLock(active)`——模态/抽屉锁 body 滚动唯一实现。Navbar 与 SearchModal 曾各写一份，同开时还原互相覆盖；收口后各自记 prev、幂等。 _Avoid_: body overflow 锁

**焦点陷阱**: `useFocusTrap(ref, active)`——模态内 Tab 循环 + 关闭还原焦点；搜索模态与移动端抽屉共用。 _Avoid_: focus trap、焦点圈住

**Error Boundary**: `src/components/ErrorBoundary.tsx`——包裹 Providers 顶层，任何 client 组件抛异常显示通用错误 UI + 重试按钮。class 方法加 `override`（noImplicitOverride）。 _Avoid_: 全局错误兜底

**返回顶部收口**: `BackToTop`——scrollY 阈值 + 圆钮 + Tooltip + 平滑回顶的单一实现，`className` 决定挂载位置（Footer 顶部 / 文章页左下）。 _Avoid_: 回到顶部按钮

**描边双背景**: `.hero-cta` 渐变描边——`background: linear-gradient(玻璃) padding-box, linear-gradient(渐变) border-box` 双层背景，替代 `::before` + mask-composite；流动动画靠 border-box 层 `background-position` keyframes。 _Avoid_: mask 描边、渐变边框

**独立 scale/translate**: CSS 独立属性——与 Framer inline `transform` 叠加生效，而 CSS `transform` 会被内联样式覆盖。CTA hover 放大/上浮、active 按压靠它。 _Avoid_: CSS transform 缩放

## 项目页

**项目数据字典**: `lib/projects.ts` 的 `Project[]`——项目页唯一数据源，每条 `{ name, url, desc, lang, stars, tags }`；新增项目 = push 一条对象，不改组件。 _Avoid_: 项目列表、仓库数据

**竖线色哈希**: `hashBarColor(url)`——URL 确定性哈希到 15 色竖线色池的纯函数，同一 URL 恒同色。区别于 `Math.random()`：渲染期随机会触发 lint purity 报错且 hydration 不稳。 _Avoid_: 随机竖线色

**鼠标跟随光晕**: 项目卡片 hover 光晕——`onMouseMove` 写 `--mx/--my` CSS 变量，`.project-card-glow`/`.project-card-border-glow` 纯 CSS 渐变层跟随，离开复位 50%/50% 淡出。与友链磁吸光晕同机制。 _Avoid_: hover 光晕、光标光晕（后者指 CursorGlow 全局光晕）

**语言色文字加深**: `.project-lang-text`——亮色覆盖用 `color-mix` 混黑加深（浅色语言如黄 `#f1e05a` 亮色下不加深看不清）；圆点保留原色。 _Avoid_: 语言名颜色

## 构建产物与陷阱

**copyrightYear 常量**: `siteConfig.copyrightYear`（2026，元旦手动更新）——版权行年份固定常量。别 `new Date().getFullYear()`：静态导出 SSR 固化构建时年份、hydration 读访问时年份，跨年/时区 mismatch。 _Avoid_: 动态年份、当前年份

**sitemap force-static 陷阱**: `sitemap.ts` 写 `revalidate = 0` 会覆盖 `force-static` 导致 sitemap.xml 不被静态导出（历史 bug：路由表 ƒ、out/ 无文件）。只留 `dynamic = 'force-static'`，中文 slug 记得 `encodeURIComponent`。 _Avoid_: revalidate 定时刷新

**RSS feed**: `scripts/gen-feed.js` 生成 `public/feed.xml`——RSS 2.0 + 全文 CDATA + 标签分类，复用 `parse-post.mjs`；站点常量与 `site.ts` 字面一致（改站点信息同步两处）。 _Avoid_: 订阅源、rss.xml

**og 分享图**: `scripts/gen-og-image.js` 生成 `public/og.png`——1200×630 sharp SVG 光栅化（支持中文），Aurora 渐变 + 56px 网格 + 中心辉光 + 「三水」标题 + URL 胶囊。CI Linux runner 自带 Noto CJK，中文渲染可靠。 _Avoid_: 社交卡片图

## 测试

**jsdom 组件测试**: `tests/search-modal.test.tsx`——`// @vitest-environment jsdom` 跑 RTL。vitest 未开 globals 时 RTL **不自动 cleanup**，必须 `afterEach(cleanup)`；jsdom 无 matchMedia 需垫片；mock `next/link`、`next/navigation`。 _Avoid_: 组件测试、RTL 测试（泛称）

## Decisions

见 `docs/adr/`——每条 ADR 记一次架构决策及其「为什么这么选」。
