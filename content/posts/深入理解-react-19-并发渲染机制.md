---
title: 深入理解 React 19 并发渲染机制
date: 2026-07-21
tags: [React, 前端, 技术]
excerpt: 从 Fiber 架构到 Concurrent Features，一文讲透 React 19 并发渲染的核心原理与实战应用。
---

# 深入理解 React 19 并发渲染机制

React 19 在 2025 年正式发布，带来了诸多令人瞩目的新特性。其中最核心、也最容易被误解的，就是**并发渲染（Concurrent Rendering）**。这篇文章将从底层原理出发，带你彻底理解并发渲染是什么、它解决了什么问题，以及如何在生产环境中正确使用它。

## 一、为什么需要并发渲染？

要理解并发渲染，首先要回顾传统 React 渲染模式的痛点。

在 React 18 之前，所有的渲染都是**同步且不可中断**的。一旦 React 开始渲染一棵组件树，它就会一口气渲染到底，期间无法被暂停、无法被插队。这意味着：

- 当组件树非常庞大时，渲染可能花费几十甚至上百毫秒
- 这段时间内，主线程被完全占用
- 用户的点击、输入等交互无法得到及时响应，造成界面卡顿

想象一个包含 10000 条数据的列表，当数据更新触发重渲染时，React 必须一次性完成所有 10000 个节点的 diff 和提交。如果这个过程耗时 50ms，那么用户在这 50ms 内做的任何操作都会被延迟。

**并发渲染的核心思想就是：把一次大渲染拆成多个小渲染单元（Fiber），让 React 能够"中断-恢复-优先级调度"。**

## 二、Fiber 架构：并发渲染的基石

Fiber 是 React 16 引入的底层架构，它是并发渲染能够实现的物理基础。

### 2.1 什么是 Fiber？

简单说，Fiber 是 React 内部的一种**数据结构**，它把组件树抽象成了一个可链式遍历的节点链表。每个 Fiber 节点对应一个组件实例，包含了：

- 组件的 type、props、state
- 指向父节点的引用 `return`
- 指向第一个子节点的引用 `child`
- 指向兄弟节点的引用 `sibling`
- 待处理的副作用 `effectTag`
- 更新队列 `updateQueue`

```typescript
interface Fiber {
  type: any;
  key: null | string;
  pendingProps: any;
  memoizedProps: any;
  memoizedState: any;
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  alternate: Fiber | null;
  effectTag: number;
  updateQueue: UpdateQueue<any> | null;
  lanes: Lanes;
}
```

这种链表结构让 React 可以**随时暂停遍历、记住当前位置、稍后再恢复**。这正是并发的关键。

### 2.2 双缓冲机制（Double Buffering）

React Fiber 内部维护了两棵树：

- **current 树**：当前屏幕上显示的 UI 对应的 Fiber 树
- **workInProgress 树**：正在内存中构建的新 Fiber 树

每个 Fiber 节点通过 `alternate` 字段指向它在另一棵树中的对应节点。当 workInProgress 树构建完成并提交后，两棵树的身份交换——这就是"双缓冲"，和 GPU 渲染中的双缓冲原理一致。

双缓冲让 React 能够在内存中"排练"一次完整的渲染，期间用户看到的依然是旧 UI，只有当渲染完整且无错时才一次性替换。

## 三、调度器（Scheduler）：谁先渲染？

并发渲染的另一块拼图是**调度器**。React 内部使用了一个基于优先级的协作式调度器。

### 3.1 时间切片（Time Slicing）

调度器把每一帧（约 16.6ms）划分为：

- **JS 执行时间**：约 5ms 给 React 进行渲染工作
- **浏览器渲染时间**：剩余时间用于 layout、paint、合成

当 5ms 用完时，React 会让出主线程给浏览器处理用户交互和绘制。这就是 `shouldYield` 函数的作用：

```typescript
function shouldYield(): boolean {
  const elapsedTime = now() - startTime;
  if (elapsedTime < frameInterval) {
    // 还没到 5ms，继续渲染
    return false;
  }
  // 时间到了，让出主线程
  return true;
}
```

### 3.2 Lane 优先级模型

React 18 引入了 **Lane 模型**来替代旧的 expirationTime。Lane 是一个 31 位的二进制数，每一位代表一种优先级。

```typescript
export const NoLanes = 0b0000000000000000000000000000000;
export const SyncLane = 0b0000000000000000000000000000001;
export const InputContinuousLane = 0b0000000000000000000000000000100;
export const DefaultLane = 0b0000000000000000000000000010000;
export const TransitionLane = 0b0000000000000000000000100000000;
export const IdleLane = 0b0100000000000000000000000000000;
```

常见优先级由高到低：

| Lane | 含义 | 典型场景 |
|------|------|----------|
| SyncLane | 同步，立即执行 | useState 同步更新 |
| InputContinuousLane | 连续输入 | 拖拽、滚动 |
| DefaultLane | 默认 | 一般的 setState |
| TransitionLane | 过渡 | useTransition 标记的更新 |
| IdleLane | 空闲 | 预渲染、垃圾回收 |

Lane 的位运算让 React 可以高效地"合并/比较/分离"多个更新，比旧的数值模型灵活得多。

## 四、实战：useTransition 与 useDeferredValue

理论讲完了，来看两个最常用的并发 Hook。

### 4.1 useTransition：标记低优先级更新

`useTransition` 让你把某些状态更新标记为"过渡"——即低优先级、可中断。典型场景是搜索框输入时同时过滤长列表：

```typescript
import { useTransition, useState } from 'react';

function SearchableList({ items }) {
  const [query, setQuery] = useState('');
  const [filteredList, setFilteredList] = useState(items);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    // 高优先级：输入框立即更新，用户感知到流畅
    setQuery(e.target.value);

    // 低优先级：列表过滤可以被打断、分批执行
    startTransition(() => {
      setFilteredList(items.filter(i => i.includes(e.target.value)));
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <span>过滤中...</span>}
      <ul>
        {filteredList.map(item => <li key={item}>{item}</li>)}
      </ul>
    </>
  );
}
```

**关键点**：如果不使用 `useTransition`，输入和过滤都在同一优先级，过滤 10000 条数据时会阻塞输入框更新，造成卡顿。用了之后，输入永远是高优先级，过滤可以让步。

### 4.2 useDeferredValue：延迟某个值的传递

`useDeferredValue` 的语义类似 React.memo + debounce，但本质是延迟值在新组件中的传递：

```typescript
import { useDeferredValue, useMemo, useState } from 'react';

function ProductList({ products }) {
  const [search, setSearch] = useState('');
  // deferredSearch 在主线程空闲时才跟上 search
  const deferredSearch = useDeferredValue(search);
  const isStale = search !== deferredSearch;

  const filtered = useMemo(
    () => products.filter(p => p.name.includes(deferredSearch)),
    [products, deferredSearch]
  );

  return (
    <>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      <ul style={{ opacity: isStale ? 0.6 : 1 }}>
        {filtered.map(p => <li key={p.id}>{p.name}</li>)}
      </ul>
    </>
  );
}
```

**useTransition vs useDeferredValue**：

- `useTransition` 主动包裹 setState，把整段更新标为低优先级
- `useDeferredValue` 被动延迟一个值的传播，常用于"已存在值"的优化

两者底层都是 TransitionLane 优先级。

## 五、Suspense 与流式 SSR

并发渲染让 React 真正支持了"等待"——Suspense。

### 5.1 客户端 Suspense

```typescript
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserProfile /> {/* 内部 use(promise) 会挂起 */}
      <Suspense fallback={<Spinner />}>
        <UserPosts /> {/* 单独的 Suspense 边界 */}
      </Suspense>
    </Suspense>
  );
}
```

当 `<UserProfile>` 内部的 `use(promise)` 还没 resolve 时，React 会抛出 promise 给最近的 Suspense 边界，显示 fallback。**关键是，React 不会丢弃已经渲染好的部分**——这就是并发的好处。

### 5.2 流式 SSR（Streaming Server Rendering）

React 18 起的 SSR 是分阶段的：

1. **Shell 渲染**：服务器先把整个应用的"外壳"渲染成 HTML 发给浏览器
2. **流式传输**：内部被 Suspense 包裹的组件一旦就绪，就流式发送额外的 HTML chunk
3. **Hydration**：每个 chunk 到达后单独 hydrate，不阻塞其他部分

这意味着用户不需要等待所有数据加载完才能看到页面骨架。在 Next.js 的 App Router 中，这一机制已经被默认启用。

## 六、常见误区与陷阱

### 6.1 并发不是并行

并发渲染**不是多线程**。React 的并发是在单线程内通过"切片让出 + 优先级抢占"实现的。它和 Web Worker 的并行计算是两回事。

### 6.2 useTransition 不是性能银弹

`useTransition` 只在以下场景有意义：

- 更新触发的渲染工作量明显大（千级以上列表）
- 该更新与用户输入等高优先级操作存在竞争

如果只是更新几个表单字段，强行用 `useTransition` 反而引入额外调度开销。

### 6.3 Suspense fallback 闪烁

多个 Suspense 边界嵌套时，如果数据加载很快，fallback 可能闪现一帧又消失。解决方式是用 React 19 的 `useOptimistic` 配合 `useTransition`，或者直接用 CSS 控制延迟显示 fallback。

## 七、性能调优清单

- ✅ 用 React DevTools Profiler 找出"长任务"组件
- ✅ 给大列表的每一项稳定的 `key`
- ✅ 用 `React.memo` 包裹纯展示组件
- ✅ 把昂贵计算包进 `useMemo`
- ✅ 用 `useTransition` 包裹"非用户立即感知"的更新
- ✅ 用 `useDeferredValue` 延迟大列表的过滤输入
- ✅ 大组件用 `Suspense` 分块，避免单点 fallback

## 八、结语

并发渲染不是 React 增加的某个 API，而是 React 内部架构的一次重构——从"同步阻塞"进化到"可中断、可调度、可优先级"。理解 Fiber、Lane、Scheduler 这三大基石，你就能在生产中正确使用 `useTransition`、`useDeferredValue` 和 Suspense，写出真正流畅的大型应用。

React 19 在此基础上还加入了 Actions、`useOptimistic`、`useFormStatus` 等更上层的封装，但这些的背后，都是同一套并发渲染机制在支撑。掌握它，你就掌握了现代 React 的灵魂。

> 下一篇预告：《TypeScript 类型体操实战：从 Conditional Types 到 Template Literal Types》
