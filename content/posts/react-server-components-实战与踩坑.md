---
title: React Server Components 实战与踩坑：从 RSC payload 到流式渲染
date: 2026-07-21
tags: [React, 前端, 技术, 踩坑]
excerpt: React Server Components 不是 SSR。本文从 RSC wire protocol 讲到 use client 边界划分，再列出 8 个生产环境踩过的坑，帮你避开 RSC 落地的所有暗礁。
---

# React Server Components 实战与踩坑：从 RSC payload 到流式渲染

React 19 把 Server Components 从「实验性框架专属」变成了 React 自身的核心能力。但社区里对 RSC 的误解依然很多——最常见的错误就是把它等同于 SSR。这篇文章会从底层 wire format 讲起，再给出 8 个我在生产环境踩过的真实坑点和解决方案。

## 一、RSC 不是 SSR，理解 wire protocol 才能理解 RSC

传统 SSR 的数据流是：

1. 服务端把组件渲染成 HTML 字符串
2. 客户端 hydrate，把 HTML 变成可交互的 React 树
3. 客户端 fetch JSON 数据，触发 re-render

RSC 的数据流完全不同：

1. 服务端把组件树**序列化成一种特殊的 JSON 流**（RSC payload），不是 HTML
2. 客户端 React Runtime 接收这个流，**反序列化成 React element 树**
3. 这个树可以直接渲染，也可以 hydrate 已有的 HTML

关键点：RSC payload 是 **「按需引用」** 的。服务端组件里如果引用了客户端组件，payload 里不会塞客户端组件的代码，而是塞一个引用：`["$","div",null,{"children":["$","$LClientComp",null,{}]}]`。其中 `$L` 表示这是一个客户端组件的 lazy reference。

```js
// 服务端组件
import ClientCounter from './ClientCounter'; // 'use client'

export default function ServerComp() {
  return (
    <div>
      <h1>服务端渲染时间：{new Date().toISOString()}</h1>
      <ClientCounter initial={0} />
    </div>
  );
}
```

对应的 RSC payload 大概长这样（简化）：

```text
0:["$","div",null,{"children":[
  ["$","h1",null,{"children":"服务端渲染时间：2026-07-31T..."}],
  ["$","$LClientCounter",null,{"initial":0}]
]}]
```

`$LClientCounter` 是一个引用，客户端 runtime 会去已经下载的 client bundle 里找 `ClientCounter`，然后挂载。**这个引用机制是 RSC 的灵魂**——它让服务端组件和客户端组件可以在一棵树里共存，而不用担心「服务端代码跑到客户端」。

## 二、'use client' 不是入口标记，是边界标记

这是第二个常见误解。很多人以为 `'use client'` 标记的是「客户端入口」，类似于 `if (typeof window !== 'undefined')`。实际上它是 **「这个文件及其依赖从服务端 bundle 中排除，只在客户端 bundle 中存在」** 的边界声明。

后果：

- `'use client'` 文件里 import 的所有模块都会被打进 client bundle，包括那些本来只该在服务端跑的库
- 反过来，`'use client'` 文件里 import 一个服务端组件会直接报错，因为服务端组件没有 client 实现

正确的边界划分原则：

1. **从叶子组件往上数**：一个组件如果用了 `useState` / `useEffect` / 浏览器 API，就标记 `'use client'`。它的父组件如果没有这些，就保持默认（服务端组件）。
2. **props 传递不能传函数**：服务端组件可以把基本类型、对象、React 元素传给客户端组件，但不能传函数（函数无法跨网络序列化）。
3. **children 是特殊 loophole**：服务端组件可以把自己的 children（也是 React 元素）传给客户端组件，这是 RSC 设计中允许的特例。

```tsx
// ❌ 错误：服务端组件把函数传给客户端组件
// ServerComp.tsx
'use server'; // 实际上不需要这个，默认就是 server
import ClientBtn from './ClientBtn';

export default function ServerComp() {
  return <ClientBtn onClick={() => console.log('clicked')} />;
  // TypeError: Functions cannot be passed directly to Client Components
}

// ✅ 正确：客户端组件自己管理 onClick
// ClientBtn.tsx
('use client');
export default function ClientBtn() {
  return <button onClick={() => console.log('clicked')}>click</button>;
}
```

## 三、踩坑 1：useEffect 在 RSC 中根本不存在

把一个用了 `useEffect` 的组件忘记加 `'use client'`，会报一个看起来很奇怪的错：

```text
Error: useEffect is not defined. This could happen for one of the following reasons:
1. You might have mismatched versions of React and React DOM.
...
```

实际上是因为没有 `'use client'`，组件被当成服务端组件编译，而服务端组件不允许用任何 hooks（`useState` / `useEffect` / `useMemo` 都不行）。

**排查方式**：看到「`useXxx` is not defined」，第一时间检查文件顶部有没有 `'use client'`。

## 四、踩坑 2：'use client' 必须在文件最顶部，前面不能有任何代码

```ts
// ❌ 报错
import { foo } from './foo'
'use client'

export default function Comp() { ... }

// ✅ 正确
'use client'
import { foo } from './foo'

export default function Comp() { ... }
```

RSC 的指令解析是基于文件顶部的字符串字面量，必须在所有 import 之前。MDX 文件里尤其容易踩——很多人在 `.mdx` 文件顶部先写了一些 markdown，再加 `'use client'`，会失败。

## 五、踩坑 3：服务端组件不能直接 import 进客户端组件

```tsx
// ClientLayout.tsx
'use client';
import ServerSidebar from './ServerSidebar'; // ❌ 报错

export default function ClientLayout() {
  return (
    <div>
      <ServerSidebar />
    </div>
  );
}
```

报错信息：`Cannot import a Server Component into a Client Component.`

原因：客户端组件被打进 client bundle，而服务端组件依赖 Node.js API（fs、db 等），无法在浏览器运行。

**解决方案**：把服务端组件作为 `children` 传进来。

```tsx
// app/layout.tsx（服务端组件）
import ClientLayout from './ClientLayout';
import ServerSidebar from './ServerSidebar';

export default function RootLayout() {
  return (
    <ClientLayout>
      <ServerSidebar />
    </ClientLayout>
  );
}

// ClientLayout.tsx
('use client');
export default function ClientLayout({ children }) {
  return <div>{children}</div>;
}
```

这样 `ServerSidebar` 在服务端渲染成 React 元素后，作为 children 传给 `ClientLayout`，client runtime 接收时它已经是 ready 的元素树。

## 六、踩坑 4：动态导入客户端组件的 ssr 选项语义变了

在传统 Next.js 里：

```ts
const Comp = dynamic(() => import('./Comp'), { ssr: false });
```

表示「这个组件只在客户端渲染，不参与 SSR」。

在 RSC 里，`{ ssr: false }` 的含义变成了 **「这个组件跳过服务端渲染，但仍然在客户端 hydrate」**。如果你在服务端组件里用 `dynamic(..., { ssr: false })`，会报：

```text
Error: ssr: false is not allowed with next/dynamic in Server Components.
Please move it into a Client Component.
```

**解决**：把 `dynamic` 调用包在一个 `'use client'` 文件里。

```tsx
// ClientOnly.tsx
'use client';
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), { ssr: false });

export default function ClientOnly() {
  return <HeavyChart />;
}
```

## 七、踩坑 5：RSC payload 里的 Date 对象会被序列化成字符串

```tsx
// ServerComp.tsx
export default function ServerComp() {
  const now = new Date();
  return <ClientComp time={now} />;
}
```

在 RSC payload 序列化过程中，`Date` 对象会被转成 ISO 字符串。客户端组件拿到的 `time` 是 `string`，不是 `Date`。

```tsx
// ClientComp.tsx
'use client';
export default function ClientComp({ time }: { time: Date }) {
  // time 实际上是 string，调用 time.getTime() 会失败
  return <div>{time.toLocaleString()}</div>;
}
```

**解决**：要么在服务端把 Date 转成 timestamp（number），客户端再 `new Date(ts)`；要么在客户端做 `new Date(time)` 转换。

类似地，`Map` / `Set` / `RegExp` 这些 ES 内置对象在 RSC payload 序列化时也都有特殊处理，**不要假设跨边界传递的对象类型完全保真**。

## 八、踩坑 6：Suspense 边界与流式渲染的配合

RSC 默认是流式的——服务端可以先把已经 ready 的部分发出去，未 ready 的部分等就绪后再发。这个机制依赖 `<Suspense>`。

```tsx
export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<Skeleton />}>
        <SlowList />
      </Suspense>
    </>
  );
}
```

`SlowList` 如果是一个慢查询的服务端组件，React 会：

1. 立刻发送 `<Header>` + `<Suspense fallback={<Skeleton/>}>` 的 HTML
2. 等 `SlowList` 就绪后，发送一段 `<script>` 标签，里面有替换 fallback 的指令

**坑点**：如果你在 `SlowList` 里又嵌套了 Suspense，且 fallback 是个大的组件树，会导致流式响应被「卡住」——服务端在等待内层 Suspense 的同时无法继续推送外层的内容。

**最佳实践**：

- 每个 `<Suspense>` 的 fallback 尽量小，最好是纯静态骨架屏
- 不要在 fallback 里放客户端组件，会触发额外的 hydration
- 慢 IO 的服务端组件单独包 Suspense，不要和其他组件混在一个 Suspense 里

## 九、踩坑 7：缓存层级与 revalidate

Next.js App Router 的缓存分四层：

1. **Request Memo**：单次请求内 dedupe fetch
2. **Data Cache**：跨请求、跨部署的 fetch 缓存
3. **Full Route Cache**：整个路由的 RSC payload 缓存
4. **Router Cache**：客户端内存里的路由缓存

**踩坑场景**：文章发布后用户看不到新内容。

原因：Full Route Cache 默认是持久的（除非用 `revalidate` 或 `dynamic = 'force-dynamic'`）。即使你的 CMS 数据已经更新，只要路由缓存还在，用户拿到的还是旧的 RSC payload。

**解决方案**：

```tsx
// app/posts/[slug]/page.tsx
export const revalidate = 60; // 60 秒后重新生成
// 或
export const dynamic = 'force-dynamic'; // 每次请求都重新渲染
// 或主动触发
import { revalidatePath } from 'next/cache';
revalidatePath('/posts');
```

对于个人博客这种纯静态场景，我倾向于 `revalidate = 3600`（1 小时）+ 发布后 webhook 调 `revalidatePath`。

## 十、踩坑 8：客户端组件里调用服务端函数（Server Actions）

Server Actions 是 RSC 配套的能力——客户端组件里可以直接调用服务端函数，框架会自动生成一个 endpoint。

```tsx
// ClientForm.tsx
'use client';
import { submitPost } from './actions'; // 这个文件里是 'use server'

export default function ClientForm() {
  return (
    <form action={submitPost}>
      <input name="title" />
      <button type="submit">发布</button>
    </form>
  );
}
```

**坑点 1：Server Action 不能返回非可序列化对象**

```tsx
// ❌ 报错
'use server'
export async function getPost() {
  return db.post.findUnique(...) // 返回的是 Prisma 对象，含 Date、Decimal 等
}

// ✅ 正确
'use server'
export async function getPost() {
  const post = await db.post.findUnique(...)
  return {
    ...post,
    date: post.date.toISOString(),
  }
}
```

**坑点 2：Server Action 在 dev 模式下重复执行**

React StrictMode 会让 effects 跑两次。Server Actions 本身不受影响，但如果你在 action 里做了副作用（写文件、发邮件），dev 模式下会触发两次。

**解决**：Server Action 里做幂等处理。比如写文件前先检查文件是否存在；发邮件前先在数据库插入一条「邮件已发送」记录，第二次进来发现记录存在就跳过。

## 十一、总结：RSC 落地的 4 条原则

1. **边界从叶子往根数**：先标记最底层的客户端组件，再往上看父组件能不能保持服务端。
2. **props 跨边界只传可序列化值**：基本类型、纯对象、React 元素可以；函数、类实例、Symbol 不行。
3. **Suspense 是流式渲染的开关**：慢 IO 必须单独包 Suspense，fallback 越简单越好。
4. **缓存策略要明确**：静态内容用 `revalidate`，动态内容用 `force-dynamic`，发布用 `revalidatePath`。

RSC 的学习曲线确实陡，但理解了 wire protocol 和边界划分后，你会发现它解决了一个长期存在的问题——如何在同一棵 React 树里，让服务端代码和客户端代码各司其职。
