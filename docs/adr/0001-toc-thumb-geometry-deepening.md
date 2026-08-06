# TOC 滚动指示条几何的 locality 深化

候选 ①（架构审查 2026-08-06）：把 TOC 指示条的「几何公式」与「何时重算几何」收进同一可测模块，消除 locality 断裂——之前公式抽成纯函数有测、副作用编排无测，`e6735f8` 修的越界 bug 就在无测的那层。

## 决策

新建 `src/components/UI/useScrollThumbGeometry.ts`（hook 住 `UI/`，与 `useDismiss`/`useNavigationLoading` 同处），窄口径返回 `{ thumb: ThumbGeometry | null }`。`TableOfContents` 用它替掉内联的 rAF / ResizeObserver / fonts.ready 编排；纯函数 `thumbGeometry` 仍留 `src/lib/`，被 hook 内部调用。

## 关键约束（grilling 收敛）

- **不监 `items` 依赖**：hook 只监 scroll container ref，靠 ResizeObserver 隐式捕获换文章时容器高度变。换文章瞬间 thumb 的一帧错位不可见（hover 才显隐，换文章时鼠标不在 TOC 上）——不为看不见的窗口加同步路径。
- **`document.fonts.ready` 只留一次**：保留 `fonts.ready.then(update)` 作冷启动兜底，删掉原实现的第二次 `.then(() => update())`——`update` 只读尺寸不写布局，第二次连跑是冗余。不靠「字体加载必触发 ResizeObserver」这个浏览器实现细节。
- **rAF 防抖搬进 hook**：ResizeObserver 多次触发合并到下一帧，hook 内用 `useRef` 持有 rAF ID，effect cleanup `cancelAnimationFrame`。
- **不抽 debounce / 不合并显隐**：thumb 的显隐只由 hover（`mouseenter`/`mouseleave`）控制，跟几何重算没有共生命周期——强行合并会让 hook 接口比「两个分离的 useState」还复杂（删显隐部分复杂度只是被推回 `TableOfContents`，不是真缝）。

## 测试

- 纯函数 `thumbGeometry` 测试**不动**（`tests/thumbGeometry.test.ts` 已固化不变量，含 `e6735f8` 越界回归）。
- hook 层测**契约**：注入伪 ResizeObserver / requestAnimationFrame（`vi.stubGlobal` + `@testing-library/react` 的 `renderHook` + jsdom），断言「hook 把 `clientHeight`/`scrollHeight`/`scrollTop` 正确喂给 `thumbGeometry`」「resize 后 thumb 几何更新」「unmount 后 rAF 被清」。**不**重复测纯函数的不变量——那是 lib 层的责任。
- 装一个 devDep `@testing-library/react`，只测 `useScrollThumbGeometry` 一处。不顺手给全仓 hook 补测（那是另一个候选的事，不在 ① scope 里）。

## 反向参考

- 不要深化 `next.config.ts` / `basePath.ts` 双态切换——架构审查候选 ⑤ 判定它们是正确尺寸的浅缝。
- `thumbGeometry` 不要从 `lib/` 搬走——lib 放纯函数、`UI/` 放 hook 是仓库已有的分界，搬走会破坏 `tests/thumbGeometry.test.ts` 这个纯函数测试。
