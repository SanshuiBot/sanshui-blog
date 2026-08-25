# sanshui-blog

三水的个人博客。Next.js 16 纯静态导出（App Router + `output: 'export'`），托管 GitHub Pages，basePath `/sanshui-blog`。「Aurora 玻璃态」设计系统，亮色为主、暗色可选。

本文件是项目 glossary——只收本项目独有的术语，不收通用编程概念。每个词给出**它是什么**（不是它做什么），并标 _避免_ 同义词。约定与命令见 `AGENTS.md`，架构决策见 `docs/adr/`。

## Language

### 主题与动效

**FOUC**: First Content FOUC——首屏前主题/accent 闪烁。本项目通过 inline `<head>` script（`accentBootstrapScript`）同步读 localStorage 写 CSS 变量来防。FOUC 闪屏的具体形态见 ADR-0001 的「不靠浏览器实现细节」收尾，及 ADR-0002 的「partial channel 混合调色盘 FOUC」修法。

**accent 解析器**: 「localStorage → 6 个 accent CSS 变量」的解析逻辑，有三条消费者路径——`resolveAccentColors`（纯函数，唯一真相源）/ `accentBootstrapScript`（inline FOUC 脚本副本）/ `getCustomPreset`（给 AccentPicker 读自定义预设）。三者校验等级必须一致（见 ADR-0002），否则会重现混合调色盘 FOUC 闪屏。 _避免_: accent 解析、调色盘逻辑（后者是结果不是解析器本身）

**reduced-motion 共享 hook**: `usePrefersReducedMotion`（`src/components/UI/usePrefersReducedMotion.ts`）——封装 `matchMedia('(prefers-reduced-motion: reduce)')` + `useSyncExternalStore`（客户端实时快照 / SSR 固定 false）的 hook，`AmbientEffects` / `ScrollProgress` / `Footer`（走马灯）/ `HeroParallax`（视差与入场）共用。替代 framer-motion 的 `useReducedMotion`——后者在设备开启 reduced-motion 且 dev 模式时打 `warnOnce` 噪音（"reduced-motion-disabled"）。 _避免_: reduced-motion 检测、matchMedia 订阅（前者是概念，后者是实现细节）

**framer 自动降级关闭**: `Providers.tsx` 的 `<MotionConfig reducedMotion="never">`——声明项目动效自管 reduced-motion（CSS 0.01ms 压制 + AmbientEffects 阀门 + 共享 hook），不依赖 framer 的自动检测降级；顺带静默 dev 下任意 motion 组件挂载时 VisualElement 的 warnOnce。 _避免_: MotionConfig 配置、reduced motion 设置（前者是组件名，后者是泛称）

**功能性动画 vs 装饰性动画**: reduced-motion 政策的核心二分。功能性（滚动淡出首屏标题/提示的 scrollY→opacity）**必须保留**——reduced 用户也要「滚动后首屏隐藏」；装饰性（视差位移、入场、无限循环）才跳过。Hero 曾把两者一起关掉导致首屏永不消失（bug 根因）。 _避免_: 全部跳过、只跳一部分（前者是 bug，后者是症状）

**主题色同步**: `ThemeColorSync`——挂在 Providers 内监听 `resolvedTheme`，动态改 `<meta name="theme-color">`（暗 `#05050a` / 亮 `#fafaf9`），浏览器地址栏颜色跟随主题；配套 `viewport.colorScheme: 'light dark'` + globals.css 的 `color-scheme` 让原生滚动条/表单控件按站点主题渲染。 _避免_: theme-color 同步、地址栏颜色（前者是属性名，后者是效果）

### 目录（TOC）

**thumb 几何**: TOC 滚动指示条（`.toc-thumb`）的高度与位置——按「可滚比例」从视口/总高/scrollTop 算出的 `{ top, height }`。副产物是「内容不超出视口时返回 `null`（无需浮层）」。由纯函数 `thumbGeometry` 持有不变量（24px 高度下限、不越视口边界），由 `useScrollThumbGeometry` hook 持有「何时重算」的副作用编排。 _避免_: 滚动条几何、指示条位置

**locality 断裂**: 纯函数与其副作用编排分居两模块时——测试集中在纯函数上（不变量有测），而真正的 bug 表面（何时调用、清理、竞态）在无测的编排层。删一个不会集中另一个的复杂度时即断裂。 _避免_: 测试盲区、副作用泄漏（后者是结果不是断裂本身）

**scroll container ref**: 一个其内容可滚的容器 DOM 节点的 React ref，`useScrollThumbGeometry` 唯一输入。ref 必须指向「`overflow-y: auto` 且内容可能超出」的节点（TOC 里是 `.toc-scroll`）。 _避免_: 滚动父级、可滚元素

### 搜索

**文章索引条目**: SearchModal 运行时 fetch 的轻量索引形状 `{ slug, title, date, excerpt, tags }`——剔除 `content`/`readingTime` 让 `posts-index.json` 从 ~72KB 涨到全量数据被序列化进 RSC payload，此处只保留 ~10KB。真相源是 `src/lib/post-index.ts` 的 `PostIndexEntry`（client-safe，不 import `server-only` 的 `Post`），由 `toIndexEntry` 适配器从完整 Post 投影。 _避免_: SearchPost、索引形状（前者是手抄副本已替，后者是描述不是名）

**搜索词元**: `tokenize(query)` 的输出——查询串按空白切成的小写词元数组。多关键词 AND 匹配：每篇索引条目把 title/excerpt/tags 拼成 haystack，每个词元都要 `includes` 命中才算（`lib/search.ts` 纯函数，`tests/search.test.ts` 有契约测试）。 _避免_: 关键词、query 分词（前者是 UI 层说法，后者是泛称）

**高亮片段**: `splitByTerms(text, query)` 返回的 `HighlightSegment[]`——文本按词元切出的 `{ text, hit }` 段，`hit: true` 的段渲染成 `<mark className="search-mark">`。大小写不敏感、原样保留大小写，拼回原文不丢字符（有单测）。 _避免_: 搜索结果高亮、mark 段（前者是效果，后者是 DOM 层）

### 交互收口（hooks / 组件）

**卸载后 setState**: React 组件卸载后定时器仍触发回调、对已卸载组件调 `setState` 的 bug 类。本仓由 `useSafeTimeout`（ADR-0003）在 hook 层统一管 `useRef` 持 timer ID + effect cleanup 自动 `clearTimeout`。调用方不再手写「ref + cleanup」仪式。 _避免_: timer 泄漏、卸载泄漏（前者是现象，后者是结果）

**滚动锁收口**: `useScrollLock(active)`——模态/抽屉打开时锁定 body 滚动，全站唯一实现。此前 Navbar 与 SearchModal 各写一份 overflow 保存/还原，同开时还原互相覆盖；收口后各自记录自己的 prev，幂等。 _避免_: body overflow 锁、滚动锁定（前者是实现细节）

**焦点陷阱**: `useFocusTrap(ref, active)`——模态/抽屉内 Tab 循环 + 关闭后焦点还原到打开者。搜索模态与移动端抽屉共用，补上此前键盘用户 Tab 逃出模态的 a11y 缺口。 _避免_: focus trap、焦点圈住（前者是英文直译，后者是描述）

**Error Boundary**: `src/components/ErrorBoundary.tsx`——全站兜底的 React class 组件，包裹在 Providers 顶层，任何 client 组件抛异常时显示通用错误 UI + 重试按钮，避免整页白屏。`getDerivedStateFromError` / `componentDidCatch` 均加 `override` 关键字（tsconfig `noImplicitOverride`）。 _避免_: 全局错误兜底（泛称）

**返回顶部收口**: `BackToTop` 组件——scrollY 阈值 + 圆钮 + Tooltip + 平滑回顶的单一实现，`className` 决定挂载位置（Footer 顶部居中 / 文章页左下固定）。 _避免_: 回到顶部按钮（描述不是名）

**描边双背景**: `.hero-cta` 的渐变描边实现——`background: linear-gradient(玻璃) padding-box, linear-gradient(渐变) border-box` 双层背景，替代 `::before` + `mask-composite: xor`。少一层伪元素、无 mask-composite 兼容坑；流动动画靠 border-box 层的 `background-position` keyframes。亮色覆盖必须整体重建双背景。 _避免_: mask 描边、渐变边框（前者是旧实现，后者是泛称）

**独立 scale/translate**: CSS 的 `scale:` / `translate:` 独立属性——与 Framer 写的 inline `transform` 叠加生效，而 CSS `transform` 会被内联样式覆盖。CTA 的 hover 放大/上浮、active 按压就靠它。 _避免_: CSS transform 缩放（会被内联覆盖）

### 项目页

**项目数据字典**: `src/lib/projects.ts` 的 `Project[]`——项目页的唯一数据源，每条 `{ name, url, desc, lang, stars, tags }`；新增项目 = 数组末尾 push 一条对象，无需改组件。 _避免_: 项目列表、仓库数据（前者是渲染结果，后者是描述不是数据源）

**竖线色哈希**: `hashBarColor(url)`——把项目 URL 确定性哈希到 15 色竖线色池的纯函数。同一 URL 恒得同色（重渲染/刷新不变），又因 URL 各异让卡片竖线各不相同。区别于 `Math.random()`：渲染期随机会触发 `react-hooks/purity` lint 报错且 hydration 不稳定。 _避免_: 随机竖线色、随机取色（它是确定性哈希，不是随机）

**鼠标跟随光晕**: 项目卡片 hover 时随光标移动的语言色光晕——卡片 `onMouseMove` 把光标相对坐标写入 `--mx`/`--my` CSS 变量，`.project-card-glow`（背景光晕）与 `.project-card-border-glow`（1px 描边发光）两个纯 CSS 渐变层用 `var(--mx)`/`var(--my)` 定位，光标离开复位 50%/50% 淡出。与友链卡片的磁吸光晕同机制。 _避免_: hover 光晕、光标光晕（前者是泛称，后者是 CursorGlow 全局鼠标光晕，两者不同）

**语言色文字加深**: `.project-lang-text` 类——元信息行里语言名的文字色：暗色基用 `var(--project-lang)` 原色，亮色覆盖用 `color-mix(in srgb, var(--project-lang) 68%, #000)` 混黑加深。浅色语言（如 JavaScript 黄 `#f1e05a`）亮色下若不加深会白得看不清；圆点保留原色（色块不怕浅）。 _避免_: 语言名颜色、语言色文字色（后者是描述不是类）

### 构建产物与陷阱

**copyrightYear 常量**: `siteConfig.copyrightYear`——版权行的年份固定常量（2026），每年元旦手动更新。不用 `new Date().getFullYear()`：客户端组件静态导出时 SSR 固化构建时年份、hydration 读访问时年份，跨年/跨时区产生 mismatch。Footer 与 Navbar 抽屉版权行共用。 _避免_: 动态年份、当前年份

**sitemap force-static 陷阱**: `sitemap.ts` 写 `revalidate = 0` 会强制动态渲染、覆盖 `force-static`，导致 sitemap.xml 不被静态导出（历史 bug：路由表显示 ƒ、`out/` 无文件）。只留 `export const dynamic = 'force-static'`，中文 slug 记得 `encodeURIComponent`。 _避免_: revalidate 定时刷新（静态导出不需要）

**RSS feed**: `scripts/gen-feed.js` 生成的 `public/feed.xml`——RSS 2.0 + 全文 CDATA + 标签分类，复用 `parse-post.mjs` 解析契约；站点常量与 `site.ts` 字面一致（改站点信息需同步两处）。Footer 的 Rss 图标是真订阅链接。 _避免_: 订阅源、rss.xml（前者是泛称，后者是路径拼写）

**og 分享图**: `scripts/gen-og-image.js` 生成的 `public/og.png`——1200×630，使用 sharp SVG 光栅化渲染（支持中文文字），Aurora 对角渐变底色 + 56px 网格 + 中心辉光 + 顶部 accent 渐变线 + 「三水」主标题 + 站点描述 + 底部 URL glass 胶囊，接入 OpenGraph/Twitter Card。CI Linux runner 自带 Noto CJK 字体，中文渲染可靠。 _避免_: 社交卡片图（描述不是名）

### 测试

**jsdom 组件测试**: `tests/search-modal.test.tsx`——`// @vitest-environment jsdom` 跑 RTL 的组件测试。vitest 未开 `globals` 时 RTL **不自动 cleanup**，必须 `afterEach(cleanup)`（否则多 render 的 DOM 累积报 multiple elements）；jsdom 无 `matchMedia` 需垫片；mock `next/link` / `next/navigation`。 _避免_: 组件测试、RTL 测试（泛称）

## Decisions

见 `docs/adr/`。每条 ADR 记一次架构决策及其「为什么这么选」——未来探索者会想知道的门槛。
