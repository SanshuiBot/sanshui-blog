# PostIndexEntry —— 文章索引条目适配器

候选 ④（架构审查 2026-08-06）：形状 `{ slug, title, date, excerpt, tags }` 在 4 处独立定义——`types.ts` 的 `Post`（含 `content`/`readingTime?`，`server-only` 锁）/ `SearchModal` 手抄的 `SearchPost` / `gen-posts-index.js` 内联字段选取 / `parse-post.mjs` 的 JSDoc 隐式形状。`types.ts` 顶 `import 'server-only'` 把 `Post` 锁在服务端，`SearchModal` 即使只想复用形状也无法 import，只能重抄。

## 决策

新建 `src/lib/post-index.ts`（**无** `server-only`，client-safe），导出 `interface PostIndexEntry`（5 字段，与 `SearchPost` 字面一致）+ `toIndexEntry(post)` 适配器。`SearchModal` 用它替掉手抄 `SearchPost`；`gen-posts-index.js` 的字段选取保持内联但补注释引 `PostIndexEntry` 为真相源（CJS 脚本不 `await import` TS，靠注释 + TS 类型双保险）。

## 关键约束（grilling 收敛）

- **5 字段精确集**：与 `SearchPost` 字面一致，不加 `readingTime?` optional——YAGNI，SearchModal 不显示阅读时间，加字段会让 `posts-index.json` 从 ~10KB 涨。
- **`toIndexEntry` 入参是 structural** `{ slug, title, date, excerpt, tags }`，**不 import `Post`**——`types.ts` 顶 `import 'server-only'`，import `Post` 会把 `server-only` 拉进 `post-index.ts` 破 client-safe。`Post` 满足 structural 入参（满足结构即接受，无需 import）。
- **`gen-posts-index.js` 不动字段选取**：CJS 脚本 `await import` 一个 `.ts` 文件需要运行时 TS 编译（本仓脚本不经过 `tsx`/`ts-node`），引入只为「统一字段选取」不值。靠「字段集字面一致」+ 注释引 `PostIndexEntry` 隐式契约绑定，未来字段变更改两处。
- **`SearchModal` 的 fetch cast 保持 unchecked**：换类型名已让「索引条目形状」收口到 `post-index.ts` 一处，运行时校验（zod/ioots）是另一个 layer 不在 ④ scope——信任 `gen-posts-index.js` 的构建期固化输出。

## 测试

四条契约测试（`tests/post-index.test.ts`）：

- `toIndexEntry` 投影出 5 字段
- `content` / `readingTime` 不进索引（固化「剔除 content」契约）
- 返回值满足 `PostIndexEntry` 接口（类型 + 运行时双验）
- 入参 structural——`parsePostFile` 返回形状也能投影（无需 import `parsePostFile`）

## 反向参考

- 不要用 `Omit<Post, 'content'>` 派生 `PostIndexEntry`——`Post` 是 `server-only`，`Omit` 仍在 `server-only` 作用域，且 client 不能 import。
- 不要给 `gen-posts-index.js` 装 `tsx` 运行时只为「统一字段选取」——YAGNI，注释 + TS 类型双保险够。
- 不要加 zod runtime parse——`posts-index.json` 是构建期固化产物，结构可信；运行时校验是另一个 layer。
- 不要顺手给 `SearchModal` 抽 `saveAccentId`（架构审查时提过的子项）——那是 ③ Accent 的 scope，不在 ④。
