---
title: Vue 3 状态管理实战：Pinia 与组合式 API 的选型
date: 2026-07-09
tags: [Vue, 前端, 状态管理, 技术]
excerpt: Vue 3 时代 Pinia 取代了 Vuex。本文讲 Pinia 的 store 模型、组合式 store、跨 store 依赖，再到与 provide/inject、useState 模式的选型决策。
---

## 引言：从 Vuex 到 Pinia 的演进

要理解 Vue 3 的状态管理，得先回头看 Vuex 这条路是怎么走出来的。

Vue 的响应式系统天然适合「组件内状态」：一个 `ref`、一个 `reactive`，模板里直接用，数据变了视图自动更新。但组件树一旦深起来，就出现两个问题：一是**跨层级传递**越来越痛，props 一层层往下穿，emit 一层层往上抛，中间组件啥也没干纯当传声筒；二是**多组件共享状态**没有归属，A 组件和 B 组件都要读同一份数据，这份数据到底放谁那儿？

Vuex 的答案是：**把这份数据拎出来，放在一个全局单例 store 里，谁要谁订阅**。它用四个核心概念组织代码：

- `state`：唯一数据源
- `getters`：派生状态，类似计算属性
- `mutations`：**同步**修改 state 的唯一合法途径
- `actions`：处理异步，最终提交 mutation

这套设计很严谨，但实战中痛点很明显：

1. **mutations 的同步限制**让写异步逻辑变得啰嗦。一个登录流程要先在 action 里发请求，拿到 token 后 `commit('SET_TOKEN', token)`，mutation 里再真改 state。多绕一层。
2. **模块嵌套（namespaced modules）心智负担重**。`dispatch('user/login', payload)` 这种字符串路径没有类型提示，重构时 IDE 帮不上忙。
3. **TypeScript 支持是后加的**，`this` 在 mutations/getters 里的类型推断一直不顺畅，社区得靠 `vuex-module-decorators` 这种第三方库打补丁。
4. **store 是单例**，SSR 场景下多个请求共用一个 store 会导致数据串污染（这个 Pinia 也没完全解决，但 API 设计上更克制）。

Pinia 最初就是 Vue 团队成员 Eduardo San Martin Morote（同时也是 Vue Router 和 Vuex 的核心维护者）为了解决这些痛点做的实验性项目，后来被官方采纳，成为 Vue 3 的**首选状态管理库**。

Pinia 相对 Vuex 做了哪些减法？

| 对比维度      | Vuex 4                                     | Pinia                           |
| ------------- | ------------------------------------------ | ------------------------------- |
| mutations     | 必须有，同步专用                           | **去掉**，action 里直接改 state |
| 模块系统      | 嵌套 modules + namespace                   | **扁平**，每个 store 独立       |
| TypeScript    | 后加的，推断弱                             | **原生设计**，类型自动推断      |
| 调试工具      | Vue DevTools 支持                          | 同样支持，且支持时间旅行        |
| store 体积    | 一个大 store                               | 按需拆分，tree-shaking 友好     |
| API 风格      | Options（state/getters/mutations/actions） | **Options 和 Setup 两种写法**   |
| 跨 store 调用 | 根 dispatch 或模块路径                     | **直接 import 另一个 store**    |

简单说：**Pinia 把 Vuex 里那些「为了约束而存在」的样板代码砍掉了，留下的是真正必要的部分——一个可响应、可追踪、可组合的状态容器**。

下面进入实战。

## Pinia 核心：state、getters、actions

Pinia 的 store 有两种写法：**Options Store** 和 **Setup Store**。先看 Options 写法，它最接近 Vuex 的肌肉记忆。

### 定义一个 store

```ts
// stores/counter.ts
import { defineStore } from 'pinia';

// 第一个参数是 store 的唯一 id，用于 devtools 和持久化
export const useCounterStore = defineStore('counter', {
  // state：返回一个对象的函数
  state: () => ({
    count: 0,
    name: 'Eduardo',
  }),

  // getters：类似计算属性，第一个参数是 state
  getters: {
    double: (state) => state.count * 2,
    // 想用其他 getter，用 this（需要显式标注返回类型）
    doublePlusOne(): number {
      return this.double + 1;
    },
  },

  // actions：同步异步都行，用 this 访问 state
  actions: {
    increment() {
      this.count++;
    },
    async fetchCount() {
      const res = await fetch('/api/count');
      this.count = await res.json();
    },
  },
});
```

### 在组件里用

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCounterStore } from '@/stores/counter';

const counter = useCounterStore();

// ❌ 直接解构会失去响应性
// const { count, name } = counter

// ✅ 用 storeToRefs 解构，保持响应性
const { count, name } = storeToRefs(counter);
// actions 可以直接解构，它们是普通函数
const { increment } = counter;
</script>

<template>
  <button @click="increment">{{ count }} / {{ name }}</button>
</template>
```

这里有个**高频踩坑点**：`storeToRefs` 为什么要单独拎出来？

因为 Pinia 的 store 本质是个 `reactive` 对象。Vue 里对 `reactive` 解构会丢失响应性（proxy 的 get trap 只在访问时触发，解构出来的基本类型值是快照）。`storeToRefs` 内部做了处理——它把 state 和 getters 转成 `ref`，而 actions 不需要响应性，直接保留原引用。

### 修改 state 的三种姿势

```ts
const counter = useCounterStore();

// 1. 直接改（Options store 也允许）
counter.count++;

// 2. $patch 批量改，性能更好
counter.$patch({
  count: counter.count + 1,
  name: 'Abalam',
});

// 3. $patch 函数式，适合修改数组等复杂结构
counter.$patch((state) => {
  state.count++;
  state.items.push('new');
});
```

### 订阅 state 变化

```ts
// store.$subscribe 监听整个 state 的变化
counter.$subscribe((mutation, state) => {
  // mutation.type: 'direct' | 'patch object' | 'patch function'
  // mutation.storeId: 'counter'
  localStorage.setItem('counter', JSON.stringify(state));
});

// store.$onAction 监听 action 的调用
const unsubscribe = counter.$onAction({
  name: 'fetchCount',
  after() {
    console.log('action 完成了');
  },
  onError(error) {
    console.error('action 报错了', error);
  },
});
```

`$subscribe` 和 `$onAction` 都返回一个取消订阅的函数，组件卸载时记得调一下，避免内存泄漏（其实在组件 setup 里注册的会自动随组件销毁，但手动管理更保险）。

## 组合式 store：Setup 语法糖

Options Store 写小例子没问题，但一旦 store 逻辑复杂起来，state/getters/actions 三块强行割裂的写法就很别扭——一个业务逻辑的 state、计算属性、方法会被拆到三个地方。

**Setup Store** 把这三块合并成一个组合式函数，和 `<script setup>` 的心智模型完全一致：

```ts
// stores/counter.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', () => {
  // state → ref / reactive
  const count = ref(0);
  const name = ref('Eduardo');

  // getters → computed
  const double = computed(() => count.value * 2);
  const doublePlusOne = computed(() => double.value + 1);

  // actions → 普通函数
  function increment() {
    count.value++;
  }
  async function fetchCount() {
    const res = await fetch('/api/count');
    count.value = await res.json();
  }

  // 必须返回所有要在组件里用的东西
  return { count, name, double, doublePlusOne, increment, fetchCount };
});
```

### 什么时候用 Setup Store？

我的判断标准是**逻辑内聚度**：

- **小工具 store**（计数器、主题切换、侧边栏开关）：Options 写法更短，一眼能看完。
- **业务 store**（用户、购物车、订单列表）：Setup 写法能把「相关的 state、computed、函数」放在一起，可读性好太多。

一个更实际的例子——用户 store，包含登录、登出、权限校验：

```ts
// stores/user.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { loginApi, userInfoApi } from '@/api/user';
import { getToken, setToken, removeToken } from '@/utils/auth';

export const useUserStore = defineStore('user', () => {
  // === state ===
  const token = ref<string>(getToken() || '');
  const userInfo = ref<UserInfo | null>(null);
  const roles = ref<string[]>([]);

  // === getters ===
  const isLogin = computed(() => !!token.value);
  const isAdmin = computed(() => roles.value.includes('admin'));
  const username = computed(() => userInfo.value?.username ?? '游客');

  // === actions ===
  async function login(payload: { username: string; password: string }) {
    const { token: newToken } = await loginApi(payload);
    token.value = newToken;
    setToken(newToken);
    await fetchUserInfo();
  }

  async function fetchUserInfo() {
    const info = await userInfoApi();
    userInfo.value = info;
    roles.value = info.roles;
  }

  function logout() {
    token.value = '';
    userInfo.value = null;
    roles.value = [];
    removeToken();
  }

  return {
    token,
    userInfo,
    roles,
    isLogin,
    isAdmin,
    username,
    login,
    fetchUserInfo,
    logout,
  };
});
```

注意 Setup Store 里**没有 `$reset`**（因为 Pinia 没法自动推断你的 setup 函数里哪些 ref 是初始 state）。如果需要重置，得自己写：

```ts
function $reset() {
  token.value = '';
  userInfo.value = null;
  roles.value = [];
}
```

而 Options Store 是自带 `$reset` 的，Pinia 会把 state 重置为工厂函数返回的初始值。

## 跨 store 依赖：actions 里调用其他 store

这是 Pinia 相对 Vuex 最舒服的一点：**跨 store 调用不需要 dispatch 字符串路径，直接 import + 调用**。

### 基本用法

```ts
// stores/cart.ts
import { defineStore } from 'pinia';
import { useUserStore } from './user';
import { useProductStore } from './product';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as Array<{ productId: number; quantity: number }>,
  }),

  getters: {
    // 在 getter 里用其他 store
    checkoutPrice(state) {
      const productStore = useProductStore();
      return state.items.reduce((total, item) => {
        const product = productStore.products.find((p) => p.id === item.productId);
        return total + (product?.price ?? 0) * item.quantity;
      }, 0);
    },
  },

  actions: {
    async checkout() {
      const userStore = useUserStore();
      const productStore = useProductStore();

      // 没登录不让结账
      if (!userStore.isLogin) {
        throw new Error('请先登录');
      }

      // 校验库存
      for (const item of this.items) {
        const product = productStore.products.find((p) => p.id === item.productId);
        if (!product || product.stock < item.quantity) {
          throw new Error(`商品 ${item.productId} 库存不足`);
        }
      }

      // 提交订单
      const order = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: this.items,
          userId: userStore.userInfo?.id,
        }),
      });

      // 清空购物车
      this.items = [];
      return order.json();
    },
  },
});
```

### 注意事项

1. **不要在 store 的顶层（setup 函数体外）调用 `useXxxStore()`**。因为 Pinia 实例可能还没创建。正确做法是在 action / getter 函数体内部调用，这时 Pinia 一定已经激活了。

```ts
// ❌ 错误：模块加载时就调用了
export const useCartStore = defineStore('cart', () => {
  const userStore = useUserStore(); // 报错：getActivePinia called with no active Pinia
  // ...
});

// ✅ 正确：延迟到使用时
export const useCartStore = defineStore('cart', () => {
  function checkout() {
    const userStore = useUserStore(); // 这里调用是安全的
    // ...
  }
  return { checkout };
});
```

2. **避免循环依赖**。A store 用 B，B 又用 A，会陷入循环等待。如果确实有这种需求，把共享的逻辑抽成一个第三方 store 或纯函数。

3. **getter 里用其他 store 要小心性能**。getter 是 computed，会缓存，但如果依赖的另一个 store 的 state 频繁变化，这个 getter 也会频繁重算。

## 持久化：pinia-plugin-persistedstate

Web 应用里有一类状态需要**持久化到 localStorage**，比如用户偏好设置、登录 token、未提交的表单草稿。手写 `watch(state, () => localStorage.setItem(...))` 太繁琐，社区方案 `pinia-plugin-persistedstate` 是事实标准。

### 安装与注册

```bash
pnpm add pinia-plugin-persistedstate
```

```ts
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

createApp(App).use(pinia).mount('#app');
```

### 在 store 里开启持久化

```ts
// stores/preferences.ts
import { defineStore } from 'pinia';

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    theme: 'light' as 'light' | 'dark',
    sidebarCollapsed: false,
    language: 'zh-CN',
  }),

  // 默认持久化整个 state 到 localStorage，key 用 store id
  persist: true,
});
```

### 自定义持久化策略

实战中往往不是「整个 state 都要存」，也不一定用 localStorage。`persist` 支持配置对象：

```ts
export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null,
    roles: [],
  }),

  persist: {
    // 存储的 key
    key: 'app-user',
    // 用 sessionStorage 而不是 localStorage
    storage: sessionStorage,
    // 只持久化 token 和 roles，不存 userInfo（可能含敏感信息）
    paths: ['token', 'roles'],
    // 数据迁移：旧版本数据格式不兼容时用
    beforeRestore: (ctx) => {
      console.log('即将从存储恢复', ctx.store.$id);
    },
    afterRestore: (ctx) => {
      console.log('已恢复', ctx.store.$id);
    },
  },
});
```

### Setup Store 里用持久化

Setup Store 没有 `state` 选项，`persist` 配置通过 `defineStore` 的第三个参数传入（**注意这是 4.x 的新语法，老版本不支持**）：

```ts
export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref('');
    const userInfo = ref(null);
    const roles = ref([]);

    // ... actions

    return { token, userInfo, roles };
  },
  {
    persist: {
      paths: ['token'],
    },
  },
);
```

### 一个常见坑：SSR 场景

`localStorage` / `sessionStorage` 只在浏览器端存在。如果你用 Nuxt 或 Vite SSR，在服务端渲染时访问 `localStorage` 会报错。`pinia-plugin-persistedstate` 内部做了判断，服务端会跳过持久化逻辑，但你**不能依赖持久化数据来决定首屏渲染内容**——服务端拿不到 localStorage，hydration 时会出现客户端数据和服务端数据不一致的 warning。

解决思路：要么把这类数据做成「客户端 only」的组件（`<ClientOnly>`），要么把持久化数据也通过 cookie 同步到服务端（Nuxt 有 `useCookie` 配合方案）。

## SSR 友好：useState vs Pinia

Vue 3 的 SSR 体系（Nuxt 3、Vite SSR）引入了一个新的状态管理原语：**`useState`**（Nuxt 3 内置，纯 Vue 3 也能自己实现一个）。

它和 Pinia 是什么关系？什么时候该用哪个？

### useState 的本质

Nuxt 3 的 `useState` 签名大概是：

```ts
function useState<T>(key: string, init?: () => T): Ref<T>;
```

它在底层做了两件事：

1. **服务端**：把 `init()` 的结果存进一个「请求级的共享对象」（`nuxt.payload` 或类似结构），key 是你传的字符串。
2. **客户端 hydration 时**：用服务端存好的数据初始化同一个 key 的 ref。

所以 `useState` 真正解决的问题是：**SSR 时服务端 async setup 拿到的数据，怎么序列化传给客户端，避免客户端重复请求**。

```vue
<!-- Nuxt 3 页面 -->
<script setup lang="ts">
// 服务端渲染时 fetch，结果进入 payload；
// 客户端 hydration 时直接复用，不再请求
const { data: users } = await useAsyncData('users', () => $fetch('/api/users'));
const count = useState('count', () => 0);
</script>
```

### useState 和 Pinia 的对比

| 维度       | `useState`                                      | Pinia                                     |
| ---------- | ----------------------------------------------- | ----------------------------------------- |
| 抽象层级   | **底层原语**，就是「带 SSR payload 同步的 ref」 | 完整状态管理框架，有 getters/actions/订阅 |
| 适用场景   | 单个响应式状态的 SSR 友好封装                   | 多模块、有派生逻辑和动作的复杂状态        |
| 代码组织   | 散落在各页面，靠 key 字符串去重                 | 集中在 `stores/` 目录，按模块组织         |
| 跨模块协作 | 没有，自己想办法                                | `useOtherStore()` 直接调用                |
| 持久化     | 没有，自己写                                    | 插件生态成熟                              |
| 学习成本   | 极低                                            | 中等                                      |

### 我的选型建议

1. **纯 CSR 项目**：用 Pinia。`useState` 的核心价值在 SSR payload 同步，CSR 项目用不上，而且它没有 actions/getters 这种结构，复杂状态管不动。

2. **Nuxt 3 项目，状态简单**：用 `useState` 就够了。比如一个全局的「当前选中的分类 id」，没必要为它建个 Pinia store。

3. **Nuxt 3 项目，状态复杂**：**Pinia + `useState` 配合**。Pinia 管业务 store（用户、购物车），`useState` 管那些「需要跨页面共享、又要在 SSR 时正确序列化」的小状态。事实上 Nuxt 官方文档也推荐这种分层。

4. **非 Nuxt 的 SSR（Vite SSR / 自研）**：`useState` 需要自己实现（核心是一个 `WeakMap` 存请求上下文 + 一个 payload 注入机制），成本不低。这时候 Pinia + `pinia-plugin-persistedstate` 反而更省心，因为 Pinia 本身对 SSR 是有设计的（`createPinia()` 在每次请求时新建实例）。

### 给纯 Vue 3 项目一个 useState 极简实现

理解原理比记住 API 重要。一个能跑的最小 `useState`：

```ts
// composables/useState.ts
import { inject, ref, type Ref } from 'vue';

// Symbol 作为 provide/inject 的 key
export const STATE_KEY: symbol = Symbol('state');

// 提供给 SSR 入口调用：把所有 state 收集成对象，序列化注入到 HTML
export function createServerState() {
  const state: Record<string, Ref<unknown>> = {};
  return {
    register<T>(key: string, init: () => T): Ref<T> {
      if (!(key in state)) {
        state[key] = ref(init());
      }
      return state[key] as Ref<T>;
    },
    // 序列化为 JSON，准备注入 HTML
    serialize(): string {
      const plain: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        plain[k] = v.value;
      }
      return JSON.stringify(plain);
    },
  };
}

// 组件里用
export function useState<T>(key: string, init?: () => T): Ref<T> {
  const store = inject(STATE_KEY) as ReturnType<typeof createServerState>;
  return store.register(key, () => (init ? init() : (null as unknown as T)));
}
```

这套实现的关键洞察是：**`useState` 本质是「带 key 的全局 ref 注册表」，它的 SSR 友好性来自于「服务端注册 → 序列化 → 客户端按相同 key 复原」这个对称流程**。Pinia 也用了类似思路（`usePinia()` + 每请求新建实例），只不过把「按 key 取 ref」升级成了「按 id 取 store」。

## 与 provide/inject 的对比

Vue 内置的 `provide` / `inject` 也是一种跨层级状态传递机制。它和 Pinia 是**互补关系**，不是替代关系。

### provide/inject 的特点

```ts
// 父组件
import { provide, ref } from 'vue';
const theme = ref('dark');
provide('theme', theme);

// 任意层级的后代组件
import { inject } from 'vue';
const theme = inject<Ref<string>>('theme')!;
```

- **作用域是组件树子树**，不是全局。`provide` 在哪个组件，只有它的后代能 `inject`。这比 Pinia 的全局单例更精确。
- **没有响应式追踪的 devtools 支持**（除非你用 `effectScope` 配合）。
- **类型安全要自己保证**，默认是 `unknown`，得手动标注。
- **适合「配置注入」「多实例场景」**。比如一个表格组件，内部用了 store，但你希望同一个页面里能放两个互不干扰的表格——这时用全局 Pinia store 就尴尬了，而 `provide` 一个局部 store 反而干净。

### Pinia vs provide/inject 决策矩阵

| 场景                                   | 推荐                         | 理由                               |
| -------------------------------------- | ---------------------------- | ---------------------------------- |
| 全局用户登录态                         | Pinia                        | 跨路由、跨组件都用，需要 actions   |
| 主题 / 语言偏好                        | Pinia + 持久化               | 需要 SSR 友好 + localStorage       |
| 表单多步向导的临时数据                 | provide/inject 或 `useState` | 只在向导组件树内有效，路由跳走就丢 |
| 组件库内部状态（如 Modal 开关）        | provide/inject               | 多实例友好，作用域精确             |
| 跨模块业务协作（购物车依赖用户、商品） | Pinia                        | 需要跨 store 调用                  |
| 第三方可插拔功能注入                   | provide/inject               | Vue 官方推荐的依赖注入范式         |

### 一个典型组合用法

实际项目里，常见的模式是 **Pinia 管全局，provide/inject 管局部**：

```ts
// 一个可复用的「编辑器面板」组件
// 全局的文档列表用 Pinia，单个面板的编辑状态用 provide

// stores/documents.ts —— 全局
export const useDocumentsStore = defineStore('documents', () => {
  const list = ref<Document[]>([]);
  // ...
  return { list };
});

// components/EditorPanel.vue —— 局部
const props = defineProps<{ docId: number }>();

// 这个 panel 的本地编辑状态
const draft = ref<string>('');
const isDirty = ref(false);

// 通过 provide 暴露给子组件（工具栏、内容区）
provide('editorState', { draft, isDirty });
```

这样设计的好处：**同一页面可以渲染多个 `EditorPanel`，它们的 `draft` 互不干扰**；而所有 panel 又能共享 `useDocumentsStore` 里的文档列表。Pinia 的全局单例模型做不到前者，provide/inject 的子树作用域做不到后者。

## 实战案例

理论讲完了，下面是 5 个我从实际项目里提炼出来的场景，每个都给可直接跑的代码。

### 案例 1：多 tab 表单状态隔离

后台系统常见需求：一个页面里多个 tab，每个 tab 是一个独立的表单，切换 tab 时各自的填写状态要保留。但如果用户切换路由再回来，这些临时状态可以丢。

用 Pinia 全局 store 不合适（多 tab 数据混在一起，路由离开时也不好清理），用 `provide/inject` 又因为 tab 切换是 `v-show` 还是 `v-if` 的差异会丢状态。

**方案：用一个「按 key 存 ref」的轻量 store，key 就是 tab 的 id。**

```ts
// stores/tabForms.ts
import { ref, type Ref } from 'vue';
import { defineStore } from 'pinia';

export const useTabFormsStore = defineStore('tabForms', () => {
  // 用 Map 存每个 tab 的表单快照
  const forms = ref<Record<string, Record<string, unknown>>>({});

  function getForm<T extends Record<string, unknown>>(tabId: string, initial: T): T {
    if (!forms.value[tabId]) {
      forms.value[tabId] = { ...initial };
    }
    return forms.value[tabId] as T;
  }

  function updateField(tabId: string, field: string, value: unknown) {
    if (forms.value[tabId]) {
      forms.value[tabId][field] = value;
    }
  }

  function clearForm(tabId: string) {
    delete forms.value[tabId];
  }

  return { forms, getForm, updateField, clearForm };
});
```

组件里：

```vue
<script setup lang="ts">
import { useTabFormsStore } from '@/stores/tabForms';

const props = defineProps<{ tabId: string }>();
const tabForms = useTabFormsStore();

// 每个 tab 实例拿到自己的表单对象
const form = tabForms.getForm(props.tabId, {
  name: '',
  email: '',
  remark: '',
});

function onInput(field: string, e: Event) {
  tabForms.updateField(props.tabId, field, (e.target as HTMLInputElement).value);
}
</script>
```

**为什么这样设计**：表单状态用 `reactive` 对象而不是一堆 `ref`，是因为表单字段动态且数量不定；用 store 而不是组件内 `ref`，是因为 tab 切换时父组件要保持这些数据不被销毁。

### 案例 2：购物车 + 库存联动

电商核心场景：购物车的商品数量不能超过库存，库存变化要实时反映到购物车能购买的最大数量上。

```ts
// stores/product.ts
import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useProductStore = defineStore('product', () => {
  const products = ref<
    Array<{
      id: number;
      name: string;
      price: number;
      stock: number;
    }>
  >([]);

  async function load() {
    products.value = await fetch('/api/products').then((r) => r.json());
  }

  // 减库存（下单成功后调用）
  function decreaseStock(productId: number, quantity: number) {
    const p = products.value.find((x) => x.id === productId);
    if (p) p.stock -= quantity;
  }

  function getStock(productId: number): number {
    return products.value.find((x) => x.id === productId)?.stock ?? 0;
  }

  return { products, load, decreaseStock, getStock };
});
```

```ts
// stores/cart.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useProductStore } from './product';

export const useCartStore = defineStore('cart', () => {
  const items = ref<Array<{ productId: number; quantity: number }>>([]);

  // 总价：依赖 product store 的价格
  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => {
      const productStore = useProductStore();
      const p = productStore.products.find((x) => x.id === item.productId);
      return sum + (p?.price ?? 0) * item.quantity;
    }, 0),
  );

  // 加购：校验库存
  function addToCart(productId: number, quantity: number) {
    const productStore = useProductStore();
    const stock = productStore.getStock(productId);
    const existing = items.value.find((i) => i.productId === productId);
    const currentQty = existing?.quantity ?? 0;

    if (currentQty + quantity > stock) {
      throw new Error(`库存不足，最多还能买 ${stock - currentQty} 件`);
    }

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.value.push({ productId, quantity });
    }
  }

  // 结算后联动减库存
  async function checkout() {
    const productStore = useProductStore();
    const order = await fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ items: items.value }),
    }).then((r) => r.json());

    // 后端下单成功 → 本地减库存 → 清购物车
    items.value.forEach((item) => {
      productStore.decreaseStock(item.productId, item.quantity);
    });
    items.value = [];

    return order;
  }

  return { items, totalPrice, addToCart, checkout };
});
```

**关键点**：`product` 和 `cart` 是两个独立 store，但通过「在 action 里 `useProductStore()`」实现联动。下单成功后**先减库存再清购物车**这个顺序很重要——如果先清购物车，减库存时就找不到 `items` 了。

### 案例 3：权限路由 + 动态菜单

后台系统普遍需求：根据用户角色动态生成路由和菜单，未授权访问要拦截。

```ts
// stores/user.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { getUserInfoApi } from '@/api/user';

export const useUserStore = defineStore('user', () => {
  const token = ref('');
  const roles = ref<string[]>([]);
  const permissions = ref<string[]>([]); // 细粒度按钮权限

  const isLogin = computed(() => !!token.value);

  async function fetchUserInfo() {
    const info = await getUserInfoApi();
    roles.value = info.roles;
    permissions.value = info.permissions;
    return info;
  }

  function hasPermission(perm: string): boolean {
    return permissions.value.includes(perm);
  }

  function hasRole(role: string): boolean {
    return roles.value.includes(role);
  }

  return {
    token,
    roles,
    permissions,
    isLogin,
    fetchUserInfo,
    hasPermission,
    hasRole,
  };
});
```

路由守卫：

```ts
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/views/Login.vue') },
    {
      path: '/',
      component: () => import('@/views/Dashboard.vue'),
      meta: { roles: ['admin', 'editor'] },
    },
    { path: '/users', component: () => import('@/views/Users.vue'), meta: { roles: ['admin'] } },
  ],
});

router.beforeEach(async (to) => {
  const userStore = useUserStore();

  // 未登录 → 去登录页
  if (!userStore.isLogin) {
    if (to.path === '/login') return true;
    return '/login';
  }

  // 已登录但没拉过用户信息 → 拉一次
  if (userStore.roles.length === 0) {
    await userStore.fetchUserInfo();
  }

  // 校验路由所需角色
  const requiredRoles = to.meta.roles as string[] | undefined;
  if (requiredRoles && !requiredRoles.some((r) => userStore.hasRole(r))) {
    return '/403';
  }

  return true;
});
```

动态菜单组件：

```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

// 全量菜单定义
const allMenus = [
  { path: '/', label: '仪表盘', roles: ['admin', 'editor'] },
  { path: '/users', label: '用户管理', roles: ['admin'] },
  { path: '/settings', label: '系统设置', roles: ['admin'] },
];

// 根据当前用户角色过滤
const visibleMenus = allMenus.filter((menu) => menu.roles.some((role) => userStore.hasRole(role)));
</script>

<template>
  <nav>
    <RouterLink v-for="menu in visibleMenus" :key="menu.path" :to="menu.path">
      {{ menu.label }}
    </RouterLink>
  </nav>
</template>
```

**为什么这套设计稳**：路由守卫和菜单组件**都依赖 `userStore` 这同一个数据源**，不会出现「菜单显示了但路由拦截了」或反过来的不同步问题。角色的计算 (`hasRole`) 集中在 store 里，组件只管用。

### 案例 4：离线优先的待办事项

PWA 场景：待办事项要支持离线编辑，联网后同步到服务端。这类**乐观更新 + 队列重试**的状态机用 Pinia 写起来很顺手。

```ts
// stores/todos.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

type Todo = {
  id: string;
  title: string;
  done: boolean;
  // 同步状态：pending 未同步 / synced 已同步 / error 同步失败
  syncStatus: 'pending' | 'synced' | 'error';
};

export const useTodosStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([]);
  const isOnline = ref(navigator.onLine);
  // 等待同步的队列
  const pendingQueue = ref<Set<string>>(new Set());

  const unfinishedCount = computed(() => todos.value.filter((t) => !t.done).length);

  // 生成临时 id（最终会被服务端 id 替换）
  function genId(): string {
    return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function addTodo(title: string) {
    const todo: Todo = {
      id: genId(),
      title,
      done: false,
      syncStatus: 'pending',
    };
    todos.value.unshift(todo);
    pendingQueue.value.add(todo.id);
    flushQueue();
  }

  function toggleTodo(id: string) {
    const todo = todos.value.find((t) => t.id === id);
    if (!todo) return;
    todo.done = !todo.done;
    todo.syncStatus = 'pending';
    pendingQueue.value.add(id);
    flushQueue();
  }

  // 把队列里的待同步项推到服务端
  async function flushQueue() {
    if (!isOnline.value || pendingQueue.value.size === 0) return;

    const idsToSync = Array.from(pendingQueue.value);
    for (const id of idsToSync) {
      const todo = todos.value.find((t) => t.id === id);
      if (!todo) continue;
      try {
        const res = await fetch('/api/todos/sync', {
          method: 'POST',
          body: JSON.stringify(todo),
        }).then((r) => r.json());
        // 服务端返回真正的 id 和同步状态
        if (res.id && res.id !== todo.id) {
          todo.id = res.id;
        }
        todo.syncStatus = 'synced';
        pendingQueue.value.delete(id);
      } catch {
        todo.syncStatus = 'error';
        // 失败不删队列，下次网络恢复重试
      }
    }
  }

  // 监听网络状态
  window.addEventListener('online', () => {
    isOnline.value = true;
    flushQueue();
  });
  window.addEventListener('offline', () => {
    isOnline.value = false;
  });

  return { todos, unfinishedCount, isOnline, addTodo, toggleTodo, flushQueue };
});
```

**几个实战要点**：

1. **临时 id 用前缀区分**（`tmp_xxx`），避免和服务端 id 撞车，也方便调试时一眼看出哪条是未同步的。
2. **`syncStatus` 字段直接挂在 todo 上**，而不是维护一个独立的「失败列表」。这样 UI 渲染时一个 `v-if="todo.syncStatus === 'error'"` 就能显示重试按钮。
3. **网络事件监听器放在 store 顶层**，store 是单例，只会注册一次。但要注意：如果 store 从来没被 `useTodosStore()` 调用过，这段代码也不会执行——所以这种全局副作用最好放在一个总是会被加载的 store 里，或者干脆放到 `App.vue` 的 setup 里。

### 案例 5：实时协作的光标位置共享

多人协作编辑器场景：每个用户的光标位置要广播给其他在线用户。这种**高频更新 + 多实例**的状态最容易写错。

```ts
// stores/presence.ts
import { ref } from 'vue';
import { defineStore } from 'pinia';

type Cursor = {
  userId: string;
  x: number;
  y: number;
  color: string;
  lastUpdate: number;
};

export const usePresenceStore = defineStore('presence', () => {
  // 其他用户的光标，用 Map 方便按 userId 增删
  const cursors = ref<Map<string, Cursor>>(new Map());
  const onlineUsers = ref<string[]>([]);

  // 节流：本地光标移动太频繁，需要节流后再广播
  let lastBroadcast = 0;
  const BROADCAST_INTERVAL = 50; // ms

  function updateLocalCursor(userId: string, x: number, y: number, color: string) {
    const now = Date.now();
    if (now - lastBroadcast < BROADCAST_INTERVAL) return;
    lastBroadcast = now;

    // 通过 WebSocket / BroadcastChannel 广播
    broadcastChannel.postMessage({
      type: 'cursor',
      userId,
      x,
      y,
      color,
    });
  }

  // 收到其他用户的光标更新
  function onRemoteCursor(cursor: Cursor) {
    cursors.value.set(cursor.userId, { ...cursor, lastUpdate: Date.now() });
  }

  // 清理超时光标（用户离开或网络断开）
  function cleanupStaleCursors(timeout = 5000) {
    const now = Date.now();
    for (const [userId, cursor] of cursors.value) {
      if (now - cursor.lastUpdate > timeout) {
        cursors.value.delete(userId);
      }
    }
  }

  // WebSocket / BroadcastChannel
  const broadcastChannel = new BroadcastChannel('presence');
  broadcastChannel.onmessage = (e) => {
    if (e.data.type === 'cursor') {
      onRemoteCursor(e.data);
    }
  };

  // 定时清理
  setInterval(cleanupStaleCursors, 1000);

  return {
    cursors,
    onlineUsers,
    updateLocalCursor,
    onRemoteCursor,
    cleanupStaleCursors,
  };
});
```

UI 渲染：

```vue
<script setup lang="ts">
import { usePresenceStore } from '@/stores/presence';

const presence = usePresenceStore();

// 把 Map 转成数组给 v-for 用
// 注意：Map 的变化不会触发 v-for 重渲染，需要用 reactive 包装或转成普通数组
</script>

<template>
  <div class="canvas" @mousemove="onMove">
    <div
      v-for="[userId, cursor] in presence.cursors"
      :key="userId"
      class="remote-cursor"
      :style="{ left: cursor.x + 'px', top: cursor.y + 'px', background: cursor.color }"
    >
      {{ userId }}
    </div>
  </div>
</template>
```

**这里有个隐藏的坑**：`cursors` 是个 `ref<Map>`，Vue 对 `Map` 的响应式追踪是支持的（通过 `triggerRef` 在 set/delete 时触发），但**模板里 `v-for` 直接遍历 Map 实例时，Vue 不会在 Map 变化时重新渲染**。解决办法是把 Map 转成数组：

```ts
const cursorList = computed(() => Array.from(cursors.value.values()));
```

或者干脆用普通对象 + `reactive`，让 Vue 的 proxy 自动追踪。

## 性能与调试

### 性能注意点

1. **大数组不要整体放到 state 里**。比如一个 10k 条记录的列表，如果整体是 `ref`，每次切片渲染都会触发依赖追踪。更优做法是用 `shallowRef` + 手动触发更新，或者只存 ids 数组，详细数据按需加载到 Map 里。

2. **getter 里不要做副作用**。getter 是 computed，Vue 假定它是纯函数，副作用会导致缓存失效时机错乱。需要副作用就放到 action 或 `watch` 里。

3. **避免在多个组件里重复 `useXxxStore()` 后立刻解构**。这本身性能没问题，但解构出来的 ref 如果被传到子组件做 props，子组件的 `watch` 会有额外开销。能传整个 store 进去就传整个。

### 调试技巧

1. **Vue DevTools 的 Pinia 面板**：可以看到每个 store 的当前 state、getters 值，支持时间旅行回放。排查「state 在哪一步被改错了」非常有效。

2. **`$subscribe` 打日志**：

```ts
userStore.$subscribe((mutation, state) => {
  console.log(`[${mutation.type}] ${mutation.storeId}`, state);
});
```

3. **`$onAction` 拦截**：所有 action 调用前/后/出错时都会触发，可以用来做统一的错误上报和性能埋点。

```ts
userStore.$onAction(({ name, args, after, onError }) => {
  const startTime = Date.now();
  console.log(`[action] ${name} called with`, args);

  after((result) => {
    console.log(`[action] ${name} done in ${Date.now() - startTime}ms`);
  });

  onError((error) => {
    console.error(`[action] ${name} failed`, error);
    // 上报到 Sentry / 自建日志
  });
});
```

## 总结

Vue 3 的状态管理选型，核心是**分层**思维。

- **组件内状态**：`ref` / `reactive`，最简单也最常用。别为了「显得专业」就把所有状态都塞进 store。
- **跨组件共享、有业务逻辑**：Pinia。Setup Store 适合复杂业务，Options Store 适合简单工具。
- **跨 store 协作**：在 action / getter 内部 `useOtherStore()`，避免循环依赖。
- **持久化需求**：`pinia-plugin-persistedstate`，注意 SSR 场景下 localStorage 的局限。
- **SSR payload 同步**：Nuxt 用 `useState`，纯 Vue 3 SSR 也可自己实现等价机制。
- **局部作用域、多实例**：`provide` / `inject`，配合 `effectScope` 还能做更精细的生命周期管理。

Pinia 相对 Vuex 的胜利，不是「更少的概念」的胜利——它依然有 state、getters、actions，本质上没省多少——而是**更少的心智负担**的胜利：没有了 mutations 这层只为约束而存在的样板代码，没有了 namespace 字符串路径，TypeScript 推断一路顺畅，跨 store 调用就是普通的函数调用。

这种「砍掉不必要的复杂度」的设计哲学，恰恰是 Vue 3 整个生态的精神内核。Composition API 砍掉了 mixin 的隐式依赖，`<script setup>` 砍掉了包装函数和 return 模板变量的样板，Pinia 砍掉了 mutations 和 namespace。剩下的，就是真正用来写业务的那部分代码。

当你在下一个项目里纠结「这个状态该放哪」时，回到三个判断：**它要跨组件共享吗？它有业务逻辑（异步、派生、联动）吗？它的作用域是全局还是子树？** 答案自然就出来了。

写 Pinia store 的时候，记得一个原则：**store 是「带响应式的业务模块」，不是「全局变量垃圾桶」**。一个几千行的 `common.ts` store 是反模式——把它按业务领域拆成 `user`、`cart`、`product`，每个 store 都小而专注，跨 store 调用把它们组合起来。这样代码可读、可测、可维护，才是状态管理工具真正想帮你做到的事情。
