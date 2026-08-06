# Accent 三解析器校验等级发散的统合

候选 ③（架构审查 2026-08-06）：「localStorage → CSS 变量」的同一段解析逻辑被手抄三遍（`resolveAccentColors` / `accentBootstrapScript` inline 副本 / `getCustomPreset`），三套校验等级已发散。生产已现混合调色盘 FOUC 闪屏分歧——partial channel 的自定义预设，纯函数回退默认，inline script 默写部分变量。

## 决策

`resolveAccentColors` 成为**唯一真相源**（已带 `ACCENT_CHANNELS.every(...)` 校验，行为正确）；inline script 补同款 channel 校验修 FOUC bug；`getCustomPreset` 删 `parsed.id === CUSTOM_ACCENT_ID` 校验统一到「只校 6 channel」。**不抽** `src/lib/accentFouc.ts`——`accentBootstrapScript` 是常量字符串、与 `ACCENT_PRESETS`/`CUSTOM_ACCENT_ID` 等模块常量同处最自然，抽出去会把一个常量和 6 个跨模块常量拆两处。

## 关键约束（grilling 收敛）

- **不抽新模块**：`accentFouc.ts` 的提议在读完全文后修正——`accentBootstrapScript` 是构建期固化的常量字符串，不是「生成函数」，无 locality 收益。修法的本质是**统一校验**不是「拆文件」。
- **inline script 的零依赖约束硬保留**：补校验靠嵌一份硬编码 6 channel 名数组 `['pink','violet','blue','teal','gold','rose']` + `.every`，不能 `import` 模块常量（约定 #23：inline script 不依赖外部模块、可安全内联 `<head>`、首屏前同步跑）。
- **`parsed.id` 校验删而非加**：`getCustomPreset` 的 `parsed.id === CUSTOM_ACCENT_ID` 是过度防御——`CUSTOM_ACCENT_STORAGE_KEY` 是本仓自己写的 key，不存在被外部代码污染的场景。删后三套解析器校验等级一致，降低认知负担。
- **不动 `AccentPicker`**：它外部已判 `stored === CUSTOM_ACCENT_ID`，删 `getCustomPreset` 内部校验不影响它。`saveAccentId` 的抽离是候选 ④ PostIndexEntry 的 scope，不在 ③ 顺手做。

## 测试

边角矩阵从 3 个 happy path 扩到 7 条，每条**双向断言** inline script（`runScript`）与 `resolveAccentColors`（纯函数）行为等价：

- partial channel（核心 FOUC bug 场景：custom JSON 只含 1/6 channel → 双方都回退默认，不默写部分变量）
- corrupt JSON → 双方都回退
- custom id 但 `CUSTOM_ACCENT_STORAGE_KEY` 为 null → 双方都回退
- `parsed.id !== 'custom'`（删校验后只要 6 channel 齐全就接受，固化校验等级统合）

未来若再新增解析路径，测试矩阵会立刻捕到发散——这是「locality 修复」：校验逻辑只写一次（在 `resolveAccentColors`），inline script 通过测试被锁定到与之一致。

## 反向参考

- 不要抽 `src/lib/accentFouc.ts`——见上文决策。
- 不要给 `resolveAccentColors` 或 inline script **加** `parsed.id` 校验——校验等级统合在「只校 6 channel」而非「加严到 parsed.id 也校」。
- 不要顺手给 `AccentPicker` 抽 `saveAccentId`——那是候选 ④ 的 scope。
