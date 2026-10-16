# 站内导航链（nav-history）—— 文章页返回按钮的判定重构

背景（架构审查 2026-10-16）：文章页返回按钮原来在**挂载时**用「同源 referrer + sessionStorage 站内标记（`InSiteNavMarker`）」双信号猜「上一条历史是不是本站」。移动端复现两个间歇性故障：① 点了回首页而非返回上一页；② 点击无响应/跳去站外。根因是**两个信号都不可靠**：referrer 只在文档加载时有效（SPA 软导航后是过期初始值）；标记由任意页面挂载时写、`pagehide` 时清，而移动端切后台/切 tab 也发 `pagehide`（PC 切窗口不发）——误清 → 误判无历史 → 回首页；reload 后 referrer 变自身同源、标记被本会话首个页面自身写入而残留 → 误判有历史 → `history.back()` 退到外站条目/空白页。另有第三根因：SSR 输出就是 `<a href="/">`，hydration 前的点击走默认行为回首页（移动端 JS 慢窗口期长）。

## 决策

**记录事实，不再猜测**：sessionStorage 维护「本标签页实际走过的站内路由栈」（键 `sansui-nav-history`，JSON 数组，元素为含 basePath 的 `location.pathname`），链尾前一项即返回目标。四件套：

- `src/lib/nav-history.ts` —— 客户端安全纯函数（sync/reset/getBackTarget/isStaticFilePathname），读写全 try/catch 静默降级；
- `src/components/UI/NavHistoryTracker.tsx`（Providers 顶层挂载，取代 `InSiteNavMarker.tsx`）—— 唯一写链方：referrer 规则（同源路由保留/其余重置）+ 路由变化镜像 + 跨域 http(s) 链接点击即重置；**刻意不监听 pagehide**；
- `src/components/UI/BackButton.tsx` —— 点击时（非挂载时）判定，`getBackTarget()` 非 null 才 `router.back()`；
- `src/lib/back-button-bootstrap.ts` —— `<head>` 内联 IIFE，hydration 前用同一链条 `location.assign(上一页)` 代劳，`backbutton:ready` 交接自注销。

返回判定三条件：`history.length > 1` + 链长 ≥ 2 + 链尾 === 当前页。

## 关键约束（grilling 收敛）

- **不监听 pagehide**：移动端切后台同样发 `pagehide`，在卸载时截断链条会误判「无站内历史」→ 回首页（正是要修的 bug）。离开场景全部前移覆盖：跨域链接点击（捕获阶段，导航未发生即重置）+ reload/地址栏离开（靠文档加载时的 referrer 规则：reload 自指保留、外站 referrer 重置）。bfcache 恢复不重新加载文档，两条前移规则对它同样成立。
- **链里存 `location.pathname`（含 basePath），不存 `usePathname()`**：Next 源码 `hasBasePath ? removeBasePath : pathname`，`usePathname` 剥 basePath，只能当路由变化触发器；脚本侧 `location.assign(链路径)` 要求链路径直通可用。
- **`history.length > 1` 守卫不可省**：复制标签页会复制 sessionStorage 但不复制历史栈（新页 length=1、链却是旧的），此时 `router.back()` 静默无操作——「点击无响应」的又一诱因。
- **React 侧与内联脚本侧判定逐条一致**（同键同格式 + 三条件）：hydration 前后行为一致是需求的一部分（移动端点击大概率落在 hydration 前）；改任一侧必须同步另一侧，链格式唯一权威是 `nav-history.ts`。
- **只给文章页返回按钮打 `data-back-link` 标**：归档/标签/关于/项目/友链等页的「返回首页」是语义不同的普通导航，不打标、行为不变（PC 端行为保持的边界）。
- **不追求「返回」替代浏览器后退**：无站内上一页时一律回首页（外站直达、无历史、隐私模式、无 JS），与既有文档化的降级语义一致；已知接受项：双击返回可能回退两级（旧代码同样暴露）、同路径重复访问后的前进镜像舞蹈退化为回首页（罕见）。

## 测试

47 个用例四层覆盖：`nav-history.test.ts`（链条纯函数：追加/幂等/镜像截断/截尾/陈旧链/length 守卫/脏数据/降级）、`nav-history-tracker.test.tsx`（referrer 四规则/路由镜像/跨域点击截断的 target 与修饰键豁免）、`back-button.test.tsx`（点击判定矩阵 + SSR href/标 + hydration 交接）、`back-button-bootstrap.test.ts`（契约 + jsdom 求值 IIFE 的真实点击行为，含隐私模式与修饰键）。浏览器端到端另测 15 场景（Pixel 5 模拟 + PC 对照）：切后台、hydration 前弱网、外站直达+下拉刷新、外链离开再返回、下拉刷新、文章间跳转、复制标签页、无 JS 降级等。jsdom 坑记录在 conventions §55：`spyOn(sessionStorage 实例)` 静默失效须 spy `Storage.prototype`。

## 反向参考

- 不要回到「referrer/标记猜历史」——两个信号在移动端各有确定的失效模式，且两个方向都会猜错（误回首页/误退外站），比一律回首页更糟。
- 不要在 `pagehide` 里截断——见上，切后台即误伤。
- 不要用 `router.push(链路径)` 代替 `router.back()`——push 会往历史栈里堆垃圾条目，破坏浏览器后退语义；`back()` 才是「返回上一页」。
- 不要把判定搬回挂载时——移动端生命周期事件（切后台/刷新）发生在挂载后，挂载时快照必然过期。
