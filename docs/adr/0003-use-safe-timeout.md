# useSafeTimeout —— 卸载安全定时器 primitive

候选 ②（架构审查 2026-08-06）：「ref + cleanup」仪式（`useRef<ReturnType<typeof setTimeout>>` + effect cleanup `clearTimeout` + null-guard）在 Tooltip / NavigationLoading / ResumeTerminal 三处逐字手写，`e6735f8` 修的 ResumeTerminal 泄漏就是这个 bug 类。抽一个窄口径 hook 统一。

## 决策

新建 `src/components/UI/useSafeTimeout.ts`，签名 `useSafeTimeout() => (fn, delay) => cancel`。hook 内 `useRef` 持有 timer ID + `useEffect` cleanup 自动 `clearTimeout`（unmount 安全），`fn` 用 ref 持有仿 `useDismiss` 模式。Tooltip 用 3 个独立实例（show/hide/guard），NavigationLoading 用 2 个（show/fallback），ResumeTerminal 用 1 个（tick 链）。

## 关键约束（grilling 收敛）

- **不内置「调用前清旧」**：双向 debounce（Tooltip show/hide 各取消对方）与 replaceable timeout（NavigationLoading 重置 show timer）语义不同，强行内置会让接口比两个独立 cancel 还复杂（删「清旧」复杂度只是被推回调用方，不是真缝）。调用方需要 replaceable 时先调返回的 `cancel()` 再 `set`——hook 内部的 `set` 会先 cancel 上一个未触发 timer，但这是「重排自然清旧」不是编排语义。
- **"inline const" 模式不在 scope**：SearchModal / CodeCopyInjector / useDismiss 在 effect 内 `const t = setTimeout` + cleanup `clearTimeout(t)` 已经安全（闭包绑死 `t`），换 hook 反而多一层间接。
- **ClickEffect 的 fire-and-forget setTimeout 不在 scope**：不对 React state、无卸载泄漏风险，`layer.remove()` 对已脱离 DOM 的 node 是 no-op。
- **effect `[]` mount-only cleanup**：fn 用 ref 持有，`set`/`cancel` 是 `useCallback` 稳定引用，cleanup 只在 unmount 清遗留 timer——这正是「卸载后 setState」bug 类的修法。

## 测试

四条契约测试（`@vitest-environment jsdom` + `renderHook` + `vi.stubGlobal` 注入伪 setTimeout/clearTimeout）：

- `set(fn, delay)` 调 `setTimeout(fn, delay)`
- 返回的 `cancel()` 调 `clearTimeout`
- unmount 时未触发的 timer 被 `clearTimeout`（核心 bug 类修法）
- `set` 重排会先清上一个未触发 timer（replaceable 语义靠 hook 内置清旧）

## 反向参考

- 不要抽 `useReplaceableTimeout` 第二层 hook——YAGNI，NavigationLoading 一个场景用，直接调 `cancel()` 再 `set` 即可。
- 不要把 SearchModal / CodeCopyInjector / useDismiss 的 inline const 也换——它们已经安全，换是为了「统一」不是 locality 收益。
- 不要内置双向 debounce 抽象——Tooltip 的 show/hide 编排与 NavigationLoading 的 show/fallback 编排语义不同，硬合并会让接口比两个独立 cancel 还复杂。
