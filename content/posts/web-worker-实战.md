---
title: Web Worker 实战：OffscreenCanvas 与 SharedArrayBuffer
date: 2026-07-16
tags: [Web Worker, 前端, 技术, 性能]
excerpt: 主线程长任务 800ms → 12ms。本文讲 Worker 的 6 种创建方式、Transferable 对象、OffscreenCanvas 渲染、SharedArrayBuffer 多线程共享内存，再到 Comlink RPC 封装。
---

# Web Worker 实战：OffscreenCanvas 与 SharedArrayBuffer

线上一个数据可视化页，渲染 50000 个数据点时主线程阻塞 800ms。改成 OffscreenCanvas + Worker 后，主线程长任务降到 12ms，整个页面对用户操作零延迟响应。这篇文章记录完整改造链路。

## 一、Web Worker 的本质限制

Worker 的核心限制是 **不能访问 DOM**。worker 里没有 `window`、`document`，不能操作 `el.style`。

但 worker **可以**：

1. 做纯计算（排序、过滤、统计）
2. 用 `fetch` / `XMLHttpRequest` 发请求
3. 用 IndexedDB 存数据
4. 用 `OffscreenCanvas` 绘制（Chrome / Edge / Firefox 全支持）
5. 用 `importScripts` 同步加载脚本（dedicated worker）

## 二、6 种 Worker 创建方式

### 方式 1：单独的 worker 文件

```ts
// worker.ts
self.onmessage = (e) => {
  const result = heavyCompute(e.data);
  self.postMessage(result);
};
```

```ts
// main.ts
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
worker.onmessage = (e) => console.log(e.data);
worker.postMessage(input);
```

### 方式 2：Blob URL 内联

适合 worker 逻辑很小的场景：

```ts
const code = `self.onmessage = e => self.postMessage(e.data * 2)`;
const blob = new Blob([code], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));
```

### 方式 3：Shared Worker（多 tab 共享）

```ts
const shared = new SharedWorker(new URL('./worker.ts', import.meta.url));
shared.port.onmessage = (e) => console.log(e.data);
shared.port.postMessage(input);
```

适合需要跨 tab 共享状态的应用（如多 tab 同步购物车）。

### 方式 4：Service Worker（网络拦截 + 离线缓存）

```ts
// sw.ts
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
```

```ts
navigator.serviceWorker.register(new URL('./sw.ts', import.meta.url));
```

### 方式 5：Audio Worklet（音频处理）

```ts
const ctx = new AudioContext();
await ctx.audioWorklet.addModule(new URL('./processor.js', import.meta.url));
const node = new AudioWorkletNode(ctx, 'my-processor');
```

### 方式 6：Vite 的 `?worker` 后缀

```ts
import MyWorker from './worker?worker';
const worker = new MyWorker();
```

这种方式的好处是 Vite 会自动处理 worker 的打包、URL、CORS 头。

## 三、Transferable 对象：零拷贝传输

主线程 → worker 默认是 **结构化克隆**，即深拷贝。深拷贝大数据很慢。

Transferable 对象允许「转移所有权」——内存本身不拷贝，只是所有权从主线程移交到 worker。

Transferable 类型：

- `ArrayBuffer`
- `MessagePort`
- `ImageBitmap`
- `OffscreenCanvas`
- `ReadableStream` / `WritableStream` / `TransformStream`

```ts
// main.ts
const buffer = new ArrayBuffer(1024 * 1024 * 100); // 100MB
worker.postMessage(buffer, [buffer]); // 第二个参数是 transferable 列表
// 此后 buffer 在主线程里变成「detached」，不能再访问

// worker.ts
self.onmessage = (e) => {
  const buffer = e.data;
  const view = new Uint8Array(buffer);
  // 处理 view
  self.postMessage(buffer, [buffer]); // 转移回主线程
};
```

## 四、踩坑 1：postMessage 的 transferable 参数位置

```ts
worker.postMessage(data, transfer);
```

很多人误写成：

```ts
worker.postMessage(data, { transfer }); // ❌ 这是 WorkerOptions 的形状
```

`postMessage` 的第二个参数就是 transferable 数组本身。

## 五、踩坑 2：Uint8Array 不能直接 transfer

```ts
const arr = new Uint8Array(1024 * 1024);
worker.postMessage(arr, [arr]); // ❌ 报错
```

TypedArray 本身不是 Transferable。要 transfer 它的 `buffer`：

```ts
worker.postMessage(arr, [arr.buffer]);
```

但 worker 里 `e.data` 拿到的还是 `Uint8Array`，因为 typed array 的构造信息（长度、offset）也会一起传过去。

## 六、OffscreenCanvas：在 Worker 里画图

`OffscreenCanvas` 是让 Canvas 在 Worker 里运行的 API。worker 里可以调用所有 2D / WebGL API，画好的结果自动显示到主线程的 canvas 上。

```ts
// main.ts
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker(new URL('./render-worker.ts', import.meta.url), { type: 'module' });
worker.postMessage({ canvas: offscreen }, [offscreen]);
```

```ts
// render-worker.ts
self.onmessage = (e) => {
  const canvas = (e.data as { canvas: OffscreenCanvas }).canvas;
  const ctx = canvas.getContext('2d')!;
  // 现在 ctx 可以正常绘制了
  renderLoop(ctx);
};

function renderLoop(ctx: OffscreenCanvasRenderingContext2D) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 1920, 1080);
  // 绘制 50000 个点
  for (let i = 0; i < 50000; i++) {
    const x = Math.random() * 1920;
    const y = Math.random() * 1080;
    ctx.fillStyle = `hsl(${(i / 50000) * 360}, 100%, 50%)`;
    ctx.fillRect(x, y, 2, 2);
  }
  requestAnimationFrame(() => renderLoop(ctx));
}
```

**踩坑**：worker 里没有 `requestAnimationFrame`（实际上 Modern 浏览器有了，但旧版没有）。降级方案用 `setInterval` 或 `setTimeout`。

## 七、实战案例：50000 点热力图

主线程方案：每帧 `clearRect` + 50000 次 `fillRect`，单帧 800ms。

OffscreenCanvas 方案：worker 里画，画完自动 blit 到主线程 canvas。主线程只需要处理用户交互（拖动、缩放），零阻塞。

但有一个问题：50000 个点的坐标变化时，怎么从主线程传到 worker？

### 方案 A：每帧 postMessage 全量数据

```ts
// main.ts
function tick() {
  const positions = generatePositions(); // Float32Array, 100k 项
  worker.postMessage({ positions }, [positions.buffer]);
}
```

每帧创建新 ArrayBuffer，transfer 给 worker。问题：GC 压力大，主线程还是有点卡。

### 方案 B：SharedArrayBuffer + Atomics

```ts
// main.ts
const sab = new SharedArrayBuffer(4 * 100000);
const positions = new Float32Array(sab);

worker.postMessage({ sab });
// 主线程写 positions，worker 读 positions
```

**前提条件**：SharedArrayBuffer 需要 COOP / COEP 安全头。

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

否则浏览器拒绝创建 SharedArrayBuffer。

## 八、踩坑 3：COEP 让第三方资源加载失败

COEP `require-corp` 要求所有跨域资源都带 `Cross-Origin-Resource-Policy: cross-origin` 头。Google Fonts、CDN 上的图片很多都没带，结果导致资源加载失败。

**解决方案**：用 `credentialless` 替代 `require-corp`（Chrome 96+）：

```http
Cross-Origin-Embedder-Policy: credentialless
```

`credentialless` 让无凭证跨域请求自动加上 CORP 头，比 `require-corp` 兼容性更好。

## 九、Comlink：把 Worker 包装成 Promise RPC

直接 postMessage 写起来很啰嗦。Google 出品的 [Comlink](https://github.com/GoogleChromeLabs/comlink) 把 worker API 包装成 RPC。

```ts
// worker.ts
import { expose } from 'comlink';

const api = {
  heavy(x: number) {
    return x * x * x;
  },
};

expose(api);
```

```ts
// main.ts
import * as Comlink from 'comlink';

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
const api = Comlink.wrap<typeof import('./worker').api>(worker);

const result = await api.heavy(42);
```

调用看起来像本地函数，实际是 RPC 到 worker。返回值自动包装为 Promise。

## 十、踩坑 4：Comlink 的 callback 参数

Comlink 默认会把函数参数序列化为「远程代理」。如果想让 worker 调用主线程函数：

```ts
import { proxy } from 'comlink';

worker.api.process(
  data,
  Comlink.proxy((progress) => {
    console.log(`${progress}%`);
  }),
);
```

`Comlink.proxy` 把 callback 转为远程代理，worker 调用时实际是反向 RPC。

## 十一、踩坑 5：Worker 的 import 限制

老版本浏览器不支持 worker 内 `import` ESM 模块。Vite 在 build 时会把 worker 内的 ESM 依赖 inline，但 dev 模式下 worker 还是用 native ESM。

```ts
// worker.ts
import { foo } from './foo'; // dev 模式直接 import，build 时被 inline
```

如果你的 worker 依赖一个大型库（如 d3），dev 模式下每次启动都重新解析 d3，慢。解决：把 d3 也打包成 worker bundle：

```ts
// vite.config.ts
worker: {
  format: 'es',
  plugins: () => [reactSwcPlugin], // worker 也走 swc
}
```

## 十二、Worker 池：管理多个 Worker

单 worker 处理并发任务时，任务会串行排队。多核 CPU 场景下应该并行。

```ts
class WorkerPool<T, R> {
  private workers: Worker[] = [];
  private queue: Array<{ task: T; resolve: (r: R) => void; reject: (e: any) => void }> = [];
  private idle: Worker[] = [];

  constructor(url: URL, size = navigator.hardwareConcurrency || 4) {
    for (let i = 0; i < size; i++) {
      const w = new Worker(url, { type: 'module' });
      this.workers.push(w);
      this.idle.push(w);
    }
  }

  async exec(task: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.dispatch();
    });
  }

  private dispatch() {
    if (this.idle.length === 0 || this.queue.length === 0) return;
    const worker = this.idle.pop()!;
    const job = this.queue.shift()!;

    const onMessage = (e: MessageEvent) => {
      worker.removeEventListener('message', onMessage);
      this.idle.push(worker);
      job.resolve(e.data as R);
      this.dispatch();
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage(job.task);
  }
}
```

## 十三、实战案例：批量 JSON 解析

任务：解析 100 个 10MB 的 JSON 文件。

### 主线程方案

```ts
for (const file of files) {
  const text = await file.text();
  const data = JSON.parse(text); // 阻塞主线程 ~150ms
  processData(data);
}
```

总阻塞：15000ms（主线程完全冻结）。

### Worker 池方案

```ts
const pool = new WorkerPool<File, any>(new URL('./json-parse-worker.ts', import.meta.url));
const results = await Promise.all(files.map((f) => pool.exec(f)));
```

总耗时：约 4000ms（8 核并行），主线程零阻塞。

## 十四、总结

Worker 不是「难用」，是「误解太多」。核心要点：

1. **Transferable 优先**：大数据用 `ArrayBuffer` + `transfer`，避免深拷贝开销
2. **OffscreenCanvas 适合计算密集的 Canvas 渲染**：50000+ 数据点用这个准没错
3. **SharedArrayBuffer 需要安全头**：COOP + COEP credentialless
4. **Comlink 让 Worker 写起来像本地函数**：RPC 抽象层
5. **Worker 池处理并发**：单核 worker 比主线程慢，多核 worker 才快

记住：主线程只该处理「用户交互 + DOM 更新」，其他都扔给 Worker。
