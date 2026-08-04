---
title: Next.js 15 App Router 实战：从 RSC 到 Route Handlers
date: 2026-07-25
tags: [Next.js, 前端, 技术, 踩坑]
excerpt: Next.js 15 把 params / searchParams 都变成了 Promise。本文讲 App Router 的 6 层缓存、generateStaticParams 与 ISR、Route Handlers 的 streaming，再到 10 个迁移踩坑点。
---

# Next.js 15 App Router 实战：从 RSC 到 Route Handlers

一个线上项目从 Next.js 14 升到 15，结果整个 dev server 启动后白屏。控制台报：

```
Error: Params should be awaited before using its properties.
```

这是 Next.js 15 最大的破坏性变化——动态路由的 `params` 变成了 `Promise`。这篇文章记录完整迁移踩坑过程，并系统梳理 App Router 的核心机制。

## 一、params / searchParams 都是 Promise 了

Next.js 14：

```tsx
// app/posts/[slug]/page.tsx
export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params; // 直接解构
  return <Post slug={slug} />;
}
```

Next.js 15：

```tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // 必须先 await
  return <Post slug={slug} />;
}
```

**为什么这么改？** Next.js 15 引入 PPR（Partial Prerendering），同一个页面可以「静态部分先返回 HTML，动态部分流式注入」。params 和 searchParams 在动态渲染场景下可能尚未就绪，所以改成 Promise。

## 二、generateMetadata 同样要 await

```tsx
// ❌ Next 14 写法，15 会报错
export function generateMetadata({ params }: { params: { slug: string } }) {
  return { title: getPost(params.slug).title };
}

// ✅ Next 15
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: (await getPost(slug)).title };
}
```

## 三、generateStaticParams 仍是同步

```tsx
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}
```

**注意**：返回的 `slug` 是原始字符串，**不要做 `encodeURIComponent`**。Next.js 内部会处理 URL 编码。如果你手动 encode，反而会导致 `getPostBySlug('%E6%B7%B1...')` 这种被双重编码的 slug。

## 四、App Router 的六层缓存

理解这六层是排查「数据不更新」的关键：

1. **Request Memo**：单次请求内 dedupe fetch（基于 URL + cache 选项）
2. **Data Cache**：fetch 的跨请求持久缓存（`fetch(url, { cache: 'force-cache' })`）
3. **Full Route Cache**：整个路由的 RSC payload + HTML 缓存（静态渲染触发）
4. **Router Cache**：客户端内存里的路由缓存（_APP Router_ 的 RSC payload）
5. **Draft Mode Cookie**：Draft Mode 的 cookie 标记
6. **bfcache**：浏览器后退/前进时的内存缓存

**典型坑**：

- 文章发布后看不到新内容 → Full Route Cache 没失效
- 后退按钮显示旧数据 → Router Cache 没刷新
- 多用户互相看到对方的数据 → 误用 `force-cache` 缓存了用户态数据

## 五、Route Handlers 的 streaming

```ts
// app/api/stream/route.ts
export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`data: ${i}\n\n`));
        await new Promise((r) => setTimeout(r, 500));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

**踩坑**：`output: 'export'` 静态导出模式下 Route Handlers **不能是动态响应**。会报：

```
Error: Route "/api/stream" used `req` as a dynamic API.
This is not supported when using `output: 'export'`.
```

静态导出场景下，Route Handler 必须返回静态数据。

## 六、踩坑 1：dynamic = 'force-dynamic' 与 ISR 冲突

```tsx
// app/posts/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 60;
```

`force-dynamic` 让路由每次请求都重新渲染，**忽略 revalidate**。两者同时存在时，`force-dynamic` 胜出。

如果想「定时重新生成静态页」，只用 `revalidate`，不要加 `force-dynamic`。

## 七、踩坑 2：cookies() / headers() 强制动态渲染

```tsx
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies(); // Next 15 也要 await
  const token = cookieStore.get('token');
  // ...
}
```

调用 `cookies()` 或 `headers()` 会让路由自动切换到**动态渲染**，失去静态优化的好处。

如果你的页面大部分静态、只小部分用 cookie，把动态部分隔离到子 route，让父 route 保持静态。

## 八、踩坑 3：'use cache' 指令与 Next 15 的缓存语义

Next.js 15 引入 `'use cache'` 指令（实验性）：

```tsx
import { cache } from 'react';

// React 的 cache 是「单次渲染内 memo」
export const getPost = cache(async (slug: string) => {
  return db.post.findUnique({ where: { slug } });
});

// Next 15 的 'use cache' 是「跨请求持久缓存'
async function getCachedPost(slug: string) {
  'use cache';
  return db.post.findUnique({ where: { slug } });
}
```

**踩坑**：`'use cache'` 函数的参数必须是**可序列化**的。传一个对象进去会报错。

## 九、踩坑 4：image 的 basePath 处理

```tsx
import Image from 'next/image';

<Image src="/logo.svg" width={100} height={100} />;
```

`next/image` 会自动加 `basePath` 前缀。但如果你用原生 `<img>` 或 `<link>`，**必须手动加 basePath**：

```tsx
import { withBase } from '@/lib/basePath';

<link rel="icon" href={withBase('/favicon.svg')} />;
```

## 十、踩坑 5：metadataBase 与 OG 图片

```tsx
export const metadata = {
  metadataBase: new URL('https://sanshui.io'),
  openGraph: {
    images: ['/og-image.png'],
  },
};
```

`metadataBase` 用于解析相对路径。但 Next.js 15 在静态导出场景下，**metadataBase 必须是绝对 URL**，否则 OG 图片 URL 会变成 `/og-image.png`，社交平台抓不到。

## 十一、踩坑 6：parallelRoutes 拦截路由

```tsx
// app/@modal/(.)post/[slug]/page.tsx
// 拦截 /post/[slug]，渲染到 @modal slot
```

parallelRoutes + intercepting routes 是 Next.js 15 最难理解的特性。**典型坑**：

1. 静态导出场景下 intercepting 不工作（需要动态路由）
2. `@modal` slot 名字任意，但必须在 layout 里声明
3. 拦截路由的 `params` 也是 Promise（Next 15）

## 十二、踩坑 7：not-found.tsx 的层级

```
app/
├── not-found.tsx          # 兜底 404
├── posts/
│   ├── [slug]/
│   │   └── page.tsx
│   └── not-found.tsx      # /posts/* 下的 404
```

`notFound()` 函数会向上查找最近的 `not-found.tsx`。

```tsx
import { notFound } from 'next/navigation';

export default async function Page({ params }) {
  const post = await getPost(params.slug);
  if (!post) notFound(); // 触发 not-found.tsx
}
```

**踩坑**：根 `not-found.tsx` 在静态导出场景下不会自动绑定到 404.html。需要手动配置：

```ts
// next.config.ts
export default {
  output: 'export',
  // 静态导出时确保 404.html 被生成
  exportTrailingSlash: true,
};
```

## 十三、踩坑 8：Server Actions 的 CSRF

Server Actions 默认有 CSRF 保护，但只对 same-origin 请求生效。

如果你的 Server Action 需要被 cross-origin 调用（不太推荐），必须显式配置：

```tsx
export const config = {
  allowedOrigins: ['https://api.example.com'],
};
```

## 十四、踩坑 9：useRouter 在 App Router 里变了

```tsx
'use client';
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/posts'); // 还可以用
router.refresh(); // 重新拉取当前路由的 RSC payload

// ❌ router.events 在 App Router 里被移除
```

监听路由变化的正确方式：

```tsx
'use client';
import { usePathname } from 'next/navigation';

function RouteTracker() {
  const pathname = usePathname();
  useEffect(() => {
    analytics.track('page_view', { path: pathname });
  }, [pathname]);
}
```

## 十五、踩坑 10：viewport 和 themeColor 不能再放 metadata 里

Next 14：

```tsx
export const metadata = {
  themeColor: '#ffffff',
  viewport: 'width=device-width',
};
```

Next 15：

```tsx
export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
};

export const metadata: Metadata = {
  // themeColor 和 viewport 不放这里
};
```

混用会报 warning。

## 十六、迁移实战：sanshui-blog 的 14 → 15

### 第一步：升级依赖

```bash
npm install next@15 react@19 react-dom@19
```

### 第二步：批量改 params / searchParams

项目里有 5 个动态路由文件，全部要改：

```tsx
// app/posts/[slug]/page.tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // ...
}

// generateMetadata 同样
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  // ...
}
```

### 第三步：检查 cookies() / headers()

Next 15 里这些也返回 Promise：

```tsx
const cookieStore = await cookies();
const headerList = await headers();
```

### 第四步：处理 layout 的 params

```tsx
// app/tags/[tag]/layout.tsx
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return <div>{children}</div>;
}
```

### 第五步：跑 lint

```bash
npm run lint
```

会发现一些「params 不再是普通对象」相关的 error，逐一修复。

## 十七、总结

Next.js 15 的核心变化是 **「async params」**，背后是 PPR 对异步数据的需要。迁移的关键点：

1. **`await params` / `await searchParams`**：所有动态路由文件都要改
2. **`await cookies()` / `await headers()`**：Next 15 里也是 Promise
3. **viewport 独立**：不再放 metadata
4. **`force-dynamic` 与 `revalidate` 互斥**：不要同时用
5. **静态导出场景下 Route Handlers 受限**：不能返回动态响应

理解这六层缓存 + async params 这两件事，App Router 就没有秘密了。
