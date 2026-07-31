---
title: Zustand 与 Jotai 实战：React 状态管理选型
date: 2026-07-14
tags: [React, 状态管理, 前端, 技术]
excerpt: Redux 时代结束了。本文讲 Zustand 的 store 模型、Jotai 的原子模型，再到 8 个真实场景下的选型决策树。
---

# Zustand 与 Jotai 实战：React 状态管理选型

我们项目里同时存在 Zustand 和 Jotai，团队常为「这个状态用哪个」争论。这篇文章梳理两种方案的本质差异，给出 8 个真实场景下的选型决策树。

## 一、Redux 的根本问题

Redux 的核心是 **「单一 store + 不可变更新 + action dispatch」**。问题：

1. **样板代码爆炸**：一个简单 toggle 要写 action、reducer、dispatch、selector 四份代码
2. **性能优化复杂**：每个 selector 都要 memo，否则全组件 re-render
3. **异步处理割裂**：thunk / saga / RTK Query 三套方案并存

Zustand 和 Jotai 都是为了解决这些问题。

## 二、Zustand：极简 store

```ts
import { create } from 'zustand'

interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
}

export const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
```

使用：

```tsx
function Counter() {
  const count = useCounterStore((s) => s.count)
  const increment = useCounterStore((s) => s.increment)
  return <button onClick={increment}>{count}</button>
}
```

**关键**：selector 函数 `(s) => s.count` 让组件只订阅 `count` 字段。当 `count` 不变时，组件不会 re-render。

## 三、Zustand 的性能陷阱：返回新对象

```tsx
// ❌ 每次 render 都创建新对象 → 永远 re-render
const { count, increment } = useCounterStore()

// ✅ 分别 subscribe
const count = useCounterStore((s) => s.count)
const increment = useCounterStore((s) => s.increment)

// ✅ 或用 shallow 比较
import { shallow } from 'zustand/shallow'
const { count, increment } = useCounterStore(shallow)
```

## 四、Zustand 中间件：persist / immer / devtools

### persist（持久化）

```ts
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist<AuthStore>(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      logout: () => set({ token: null }),
    }),
    { name: 'auth-storage' }  // localStorage key
  )
)
```

### immer（不可变更新）

```ts
import { immer } from 'zustand/middleware/immer'

export const useUserStore = create(
  immer<UserStore>((set) => ({
    profile: { name: '', age: 0, address: { city: '' } },
    updateCity: (city) =>
      set((state) => {
        state.profile.address.city = city  // 直接 mutate，immer 处理
      }),
  }))
)
```

### devtools（Redux DevTools 集成）

```ts
export const useStore = create(
  devtools(
    (set) => ({
      /* ... */
    }),
    { name: 'my-store' }
  )
)
```

## 五、Jotai：原子化状态

```tsx
import { atom, useAtom } from 'jotai'

const countAtom = atom(0)

function Counter() {
  const [count, setCount] = useAtom(countAtom)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

**核心差异**：Jotai 的「atom」是**单值**，多个 atom 组合成依赖图。Zustand 的「store」是**对象**，所有状态聚在一起。

## 六、Jotai 的派生 atom

```tsx
const todosAtom = atom<Todo[]>([])
const filterAtom = atom<'all' | 'active' | 'completed'>('all')

// 派生 atom：依赖其他 atom，自动 memo
const filteredTodosAtom = atom((get) => {
  const todos = get(todosAtom)
  const filter = get(filterAtom)
  if (filter === 'all') return todos
  return todos.filter((t) => t.completed === (filter === 'completed'))
})

// 写入 atom：可以同时改多个上游 atom
const addTodoAtom = atom(null, (get, set, text: string) => {
  const todos = get(todosAtom)
  set(todosAtom, [...todos, { id: Date.now(), text, completed: false }])
})
```

**派生 atom 的依赖关系是动态的**。`filteredTodosAtom` 在 `filter === 'all'` 时只依赖 `todosAtom`；在 `filter === 'completed'` 时同时依赖 `todosAtom` 和 `filterAtom`。

## 七、Jotai 的性能优势：精确订阅

```tsx
// 组件 A 只关心 todos 长度
const count = useAtomValue(
  atom((get) => get(todosAtom).length)
)

// 组件 B 关心 todos 内容
const todos = useAtomValue(todosAtom)
```

当 todos 内容变但长度没变时，组件 A 不 re-render。这种**精确订阅**在 Zustand 里需要手写 selector，在 Jotai 里是 atom 的天然属性。

## 八、实战场景 1：全局用户态

**选 Zustand**。

```ts
const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => {
    const { user, token } = await api.login(email, password)
    set({ user, token })
  },
  logout: () => set({ user: null, token: null }),
}))
```

理由：

- 用户态是**全局单例**，Zustand 的 store 模型恰好匹配
- 配合 `persist` 中间件，自动同步 localStorage
- 不需要派生计算，直接 `useAuthStore((s) => s.user)`

## 九、实战场景 2：复杂表单

**选 Jotai**。

```tsx
const formAtom = atom({
  name: '',
  email: '',
  age: 0,
})

const nameAtom = atom(
  (get) => get(formAtom).name,
  (get, set, newName: string) =>
    set(formAtom, { ...get(formAtom), name: newName })
)

// 字段级验证
const nameErrorAtom = atom((get) => {
  const name = get(nameAtom)
  if (!name) return 'Name is required'
  if (name.length < 2) return 'Name too short'
  return null
})
```

理由：

- 表单字段间常有**派生关系**（密码强度、字段联动验证）
- Jotai 的 atom graph 自然表达这种依赖
- 表单的「重置」「部分更新」用 atom 写起来很优雅

## 十、实战场景 3：服务端数据缓存

**两个都不选，用 TanStack Query**。

```tsx
const { data: posts } = useQuery({
  queryKey: ['posts'],
  queryFn: api.getPosts,
})
```

理由：

- 服务端数据有**失效、重取、乐观更新**等复杂逻辑，Query 已经成熟实现
- Zustand / Jotai 是客户端状态库，强行管服务端数据会重复造轮子

## 十一、实战场景 4：URL 同步状态

**选 Zustand + 自定义存储**。

```ts
const useFilterStore = create<FilterStore>((set, get) => ({
  search: '',
  tags: [],
  setSearch: (v) => {
    set({ search: v })
    syncUrl(get())
  },
}))
```

Jotai 也能做，但 Zustand 的 store 概念更容易让 URL 和 store 双向同步。

## 十二、实战场景 5：大量瞬时 UI 状态

**选 Jotai 的 atomFamily**。

```tsx
import { atomFamily } from 'jotai/utils'

const todoCompletedAtom = atomFamily(
  (id: number) => atom(false),
  (a, b) => a === b  // equality function for cache
)

function TodoItem({ id }: { id: number }) {
  const [completed, setCompleted] = useAtom(todoCompletedAtom(id))
  return (
    <input
      type="checkbox"
      checked={completed}
      onChange={(e) => setCompleted(e.target.checked)}
    />
  )
}
```

理由：

- 1000 个 todo 各有独立 `completed` 状态，用 Zustand 单 store 会让 selector 复杂
- `atomFamily` 给每个 id 一个独立 atom，组件精确订阅自己的 atom
- atom 的依赖图自动处理「全选/取消全选」之类的联动

## 十三、踩坑 1：Jotai atom 在组件作用域创建

```tsx
// ❌ 每次 render 创建新 atom
function Component({ initial }) {
  const myAtom = atom(initial)
  // ...
}

// ✅ 用 atomFamily 或 useCallback
const myAtomFamily = atomFamily((initial) => atom(initial))
function Component({ initial }) {
  const myAtom = useMemo(() => myAtomFamily(initial), [initial])
  // ...
}
```

## 十四、踩坑 2：Zustand 的 set 函数

```ts
// ❌ 用 set 直接覆盖会丢失其他字段
set({ count: 0 })  // 如果 store 还有 name 字段，name 会丢
```

实际上 Zustand 的 `set` 默认是**浅合并**，类似 React 的 `setState`。上面的代码**不会丢其他字段**。

但要注意：

```ts
// ❌ 把函数放到 state 里
set({ increment: () => set((s) => ({ count: s.count + 1 })) })
```

increment 是函数，set 会浅合并 increment 字段。函数闭包里的 set 是初始的 set，**可能 stale**。

## 十五、踩坑 3：Jotai 的 get 不能在 setter 外用

```tsx
const myAtom = atom(0)

// ❌ 组件作用域直接 get
function Component() {
  const value = myAtom.get()  // 报错，atom 没有这个 API
}

// ✅ 通过 useAtomValue
function Component() {
  const value = useAtomValue(myAtom)
}
```

## 十六、决策树

| 场景 | 推荐 |
| --- | --- |
| 全局单例状态（auth、theme） | Zustand |
| 大量联动派生状态 | Jotai |
| 复杂表单 | Jotai |
| 服务端数据缓存 | TanStack Query |
| URL 同步状态 | Zustand |
| 大量独立元素的瞬时状态 | Jotai atomFamily |
| 简单计数 / toggle | 任意 |
| 跨组件共享 + 性能敏感 | Jotai |

## 十七、混合方案实战

项目里 auth 用 Zustand、表单用 Jotai、服务端数据用 Query：

```tsx
// 顶层
const { user } = useAuthStore()
const { data: posts } = useQuery({
  queryKey: ['posts', user?.id],
  queryFn: () => api.getPosts(user!.id),
  enabled: !!user,
})

// 表单
const [title, setTitle] = useAtom(titleAtom)
```

三种库职责清晰，互不干扰。

## 十八、总结

Zustand 和 Jotai 不是竞争关系，是互补关系：

1. **Zustand**：极简 store 模型，适合全局状态
2. **Jotai**：原子化依赖图，适合复杂派生和细粒度订阅
3. **TanStack Query**：服务端数据缓存专用

选型不是「哪个更强」，是「哪个更匹配场景」。如果你的项目同时有全局态、复杂表单、服务端数据，三个一起用反而比强行统一更优雅。
