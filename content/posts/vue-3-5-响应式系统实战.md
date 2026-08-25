---
title: Vue 3.5 响应式系统实战：从 ref 到 shallowReactive
date: 2026-07-11
tags: [Vue, 前端, 技术, 踩坑]
excerpt: Vue 3.5 的响应式系统经过多次重构，本文从 ref/reactive/computed 的底层实现讲到 effect 依赖追踪，再到 6 个生产环境踩坑点。
---

## 引言：Vue 3.5 响应式系统的新变化

Vue 3.5（代号 "Tengen Toppa Gurren Lagann"，2024 年 9 月正式发布）对响应式系统做了一次彻头彻尾的重构。这次重构不是表面功夫，而是把底层的依赖追踪数据结构从「依赖数组 + 版本号」换成了「双向链表 + 版本链表」。听起来很学术，但实际影响是：

- 内存占用降低约 56%（官方 benchmark，针对大量 reactive 对象场景）
- 大型依赖图（比如几千个 computed 互相依赖）的计算速度提升 8-10 倍
- ref/reactive/computed 的行为更一致，之前一些「玄学」问题有了明确解释

为什么要在 2026 年还聊 3.5？因为很多团队的 Vue 还停在 3.0-3.3，升级时踩的坑往往不是 API 变了，而是底层行为变了但文档没讲清楚。本文不讲怎么用（文档写得很好），讲的是「为什么这么用」和「不这么用会怎样」。

我们先从一个最小的例子开始，看看 Vue 3.5 的响应式到底在做什么：

```javascript
import { ref, effect } from 'vue';

const count = ref(0);

effect(() => {
  console.log('count is', count.value);
});

count.value = 1;
// 控制台输出：
// count is 0
// count is 1
```

这段代码背后发生了三件事：`ref(0)` 创建了一个响应式对象；`effect` 注册了一个副作用函数，并在首次执行时把 `count.value` 的读取记录为依赖；`count.value = 1` 触发依赖更新，重新执行 effect。

整个响应式系统的核心就是这三步的反复演绎：创建响应式对象 → 副作用函数追踪依赖 → 修改触发更新。下面我们逐层拆开。

## 响应式核心：Proxy + effect

### reactive 的 Proxy 拦截

Vue 3 的响应式基于 ES6 的 Proxy，这已经不是新闻。但很多人不知道的是，Vue 3.5 对 Proxy 的 handler 做了相当细致的优化。看一段简化版的源码逻辑：

```javascript
// 简化版，省略了数组、Map、Set 的特殊处理
function createReactiveObject(target, isShallow, isReadonly) {
  // 已经是响应式对象，直接返回
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  return new Proxy(target, {
    get(target, key, receiver) {
      // 处理 IS_REACTIVE 等内部标记
      if (key === ReactiveFlags.IS_REACTIVE) return !isReadonly;
      if (key === ReactiveFlags.RAW) return target;

      const res = Reflect.get(target, key, receiver);

      // 浅层模式不转换
      if (isShallow) return res;

      // ref 解包（数组整数索引除外）
      if (isRef(res)) {
        return res.value;
      }

      // 深层响应式：递归转换
      if (isObject(res)) {
        return isReadonly ? readonly(res) : reactive(res);
      }

      // 收集依赖
      track(target, key);

      return res;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);

      // 值变化才触发（Vue 3.5 的优化之一：更精确的 hasChanged 判断）
      if (target === receiver[ReactiveFlags.RAW]) {
        if (!hadKey) {
          trigger(target, TriggerOpTypes.ADD, key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, TriggerOpTypes.SET, key, value, oldValue);
        }
      }

      return result;
    },
  });
}
```

这里有几个关键点需要特别注意：

第一，**reactive 的深层转换是惰性的**。`reactive({ a: { b: 1 } })` 在创建时不会递归遍历整个对象，只有当你访问 `.a` 时才会把 `{ b: 1 }` 也转换成响应式。这和 Vue 2 的 `Object.defineProperty` 全量遍历有本质区别——Vue 2 在初始化一个巨型对象时会卡顿，Vue 3 不会。

第二，**reactive 对象内部会缓存 Proxy**。同一个原始对象第二次调用 `reactive()` 时，返回的是之前创建的同一个 Proxy。这就是为什么下面的代码不会出问题：

```javascript
const raw = { count: 0 };
const r1 = reactive(raw);
const r2 = reactive(raw);

console.log(r1 === r2); // true，同一个 Proxy
```

第三，**`hasChanged` 的判断比想象中严格**。Vue 3.5 用的是 `Object.is` 而不是 `===`。这意味着 `NaN` 和 `NaN` 不会触发更新（`Object.is(NaN, NaN) === true`），而 `+0` 和 `-0` 会触发更新（`Object.is(+0, -0) === false`）。在处理浮点数和特殊值时要小心。

### effect：副作用函数与依赖追踪

`effect` 是整个响应式系统的发动机。`watch`、`watchEffect`、`computed`、组件的渲染函数，底层全部是 `effect`。理解了 effect，就理解了 Vue 响应式的 80%。

```javascript
let activeEffect = null;
const targetMap = new WeakMap(); // target -> (key -> Set<effect>)

function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  if (!options.lazy) {
    _effect.run(); // 立即执行一次，触发依赖收集
  }

  return _effect;
}

function track(target, key) {
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  dep.add(activeEffect);
  activeEffect.deps.push(dep); // 反向引用，用于清理
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (dep) {
    // 复制一份再遍历，避免 effect 执行过程中修改 Set 导致无限循环
    const effects = [...dep];
    effects.forEach((effect) => effect.run());
  }
}
```

这段伪代码揭示了几个核心机制：

**依赖收集是自动的，但只在 effect 内有效。** 在 effect 外面读取 `reactive.count`，不会收集任何依赖，因为 `activeEffect` 是 null。这就是为什么你必须在 `watchEffect` 或 `computed` 内部访问响应式数据，才有可能触发更新。

**依赖是双向引用。** effect 记录了它依赖的所有 dep（Set），每个 dep 也记录了哪些 effect 依赖它。这个双向引用在 Vue 3.5 中被重构为双向链表，节点的增删都是 O(1)，这是性能提升的关键。

**trigger 时复制 dep。** 如果不复制，当 effect 内部又修改了触发它的响应式数据时，会形成无限循环。Vue 3.5 通过版本号机制避免了不必要的重复执行，但复制保护依然存在。

下面是一个实际跑得起来的 effect 示例，展示了依赖的动态收集：

```javascript
import { ref, effect } from 'vue';

const flag = ref(false);
const a = ref('A');
const b = ref('B');

effect(() => {
  // 当 flag 为 false 时，这个 effect 只依赖 flag 和 a
  // 当 flag 为 true 时，只依赖 flag 和 b
  console.log(flag.value ? b.value : a.value);
});

a.value = 'A2'; // 触发更新，打印 A2
flag.value = true; // 触发更新，打印 B
a.value = 'A3'; // 不再触发，因为 effect 不再依赖 a
b.value = 'B2'; // 触发更新，打印 B2
```

这个「依赖动态变化」的行为是 Vue 3 响应式的一大特点。每次 effect 重新运行前，Vue 会先清理上一轮收集的依赖（通过前面提到的反向引用），然后重新运行收集新的依赖。这意味着 effect 的依赖集合总是反映「最近一次执行」的依赖。

在 Vue 3.5 之前，这个清理过程在大依赖图下会比较慢；3.5 的双向链表版本把这个开销降到了最低。这也是为什么 3.5 在「频繁切换分支」的场景下性能明显更好。

## ref vs reactive：选择困境

### 本质区别

`ref` 和 `reactive` 是两种不同的响应式抽象，理解它们的差异是避免踩坑的前提。

| 特性       | ref                         | reactive                    |
| ---------- | --------------------------- | --------------------------- |
| 适用类型   | 任意值（含原始类型）        | 仅对象/数组                 |
| 访问方式   | `.value`                    | 直接属性访问                |
| 模板中解包 | 自动解包                    | 无需解包                    |
| 整体替换   | 直接赋新值                  | 需 `Object.assign` 或逐属性 |
| 解构响应性 | 解构后丢失                  | 需 `toRefs`                 |
| 深层响应   | 默认深层                    | 默认深层                    |
| 内部实现   | RefImpl 类 + class accessor | Proxy                       |

最常被问到的问题是：**到底该用 ref 还是 reactive？** 我个人的实战经验是：

1. **原始类型（number、string、boolean）必须用 ref**，reactive 对原始类型无效。
2. **表单对象、配置对象用 reactive**，因为属性访问更自然，代码更短。
3. **需要整体替换的对象用 ref**，比如从接口拉下来的数据 `const user = ref(null); user.value = await fetchUser()`。
4. **组件间共享的独立状态用 ref**，组合式 API 的 setup 返回值也优先 ref。

下面这个例子展示了一个常见的误区——用 reactive 存原始类型：

```javascript
import { reactive } from 'vue';

// 错误：reactive 不能包裹原始类型
const count = reactive(0); // 警告：value should be an object
// 实际上 count 就是 0，没有任何响应式能力

// 正确：用 ref
const count = ref(0);
count.value++; // 触发更新
```

### ref 的 `.value` 魔法

ref 的 `.value` 一直被诟病「啰嗦」，但它是必要的设计：JavaScript 的原始类型是值传递，无法通过 Proxy 拦截，只能包一层对象用 getter/setter。Vue 3.5 通过 `RefImpl` 类实现 ref，核心逻辑大致是：

```javascript
class RefImpl {
  private _value: T
  public dep: Dep = new Dep()

  constructor(value: T, isShallow: boolean) {
    this._value = isShallow ? value : toReactive(value)
  }

  get value() {
    this.dep.track()  // 收集依赖
    return this._value
  }

  set value(newVal) {
    if (hasChanged(newVal, this._value)) {
      this._value = newVal
      this.dep.trigger()  // 触发更新
    }
  }
}
```

这里有个容易忽略的细节：**ref 对对象类型会自动调用 `reactive` 转换**。也就是说 `ref({ count: 0 })` 内部的 `_value` 其实是一个 reactive Proxy。这就解释了为什么下面两种写法等价：

```javascript
// 写法一：reactive 包裹对象
const state = reactive({ count: 0 });
state.count++; // 触发更新

// 写法二：ref 包裹对象
const state = ref({ count: 0 });
state.value.count++; // 触发更新，因为 .value 是 reactive
```

但有一个**关键陷阱**：如果你用 ref 存对象，然后整体替换 `.value`，新对象会被重新转成 reactive；如果你只改 `.value` 的属性，走的是 reactive 的 Proxy 拦截。这两种路径都正常工作，但如果你在 ref 外部直接持有原始对象的引用并修改它，是不会触发更新的——因为修改的不是 Proxy。

```javascript
const state = ref({ count: 0 });
const raw = state.value; // raw 是 reactive Proxy
raw.count++; // 触发更新（走 Proxy）

// 但如果你这么干：
const realRaw = toRaw(state.value); // 拿到原始对象
realRaw.count++; // 不触发更新！绕过了 Proxy
```

### 模板自动解包的边界

Vue 模板中，顶层的 ref 会自动解包，所以 `{{ count }}` 而不是 `{{ count.value }}`。但这个解包只在「顶层」生效，嵌套在对象里的 ref 不会自动解包：

```vue
<template>
  {{ count }}
  <!-- 自动解包，显示 0 -->
  {{ state.count }}
  <!-- state 是 reactive，正常显示 -->
  {{ obj.nested }}
  <!-- 不会解包，显示 RefImpl 对象 -->
</template>

<script setup>
import { ref, reactive } from 'vue';

const count = ref(0);
const state = reactive({ count: 0 });

// 陷阱：把 ref 塞进 reactive 的属性
const nested = ref(1);
const obj = reactive({ nested });
// obj.nested 实际上会自动解包成 1（reactive 对 ref 属性有解包逻辑）
// 所以 {{ obj.nested }} 显示 1，不是 RefImpl
// 但如果你用 ref 包对象再嵌套，行为又不同
</script>
```

实际上，reactive 对 ref 类型的属性有专门的解包逻辑：当你访问 `obj.nested` 时，如果 `nested` 是 ref，会自动返回 `.value`。这就是上面注释里说的「自动解包成 1」。但这个行为有个例外：**如果 ref 是数组的元素，访问时不会解包**。

```javascript
const arr = reactive([ref(0), ref(1)]);
console.log(arr[0]); // RefImpl，不解包
console.log(arr[0].value); // 0
```

这个例外源于 Vue 团队的一个权衡：数组通常存的是同类型数据，如果对 ref 元素解包，会让 `arr[0]` 的类型变得不稳定。但这个权衡也导致了一个真实的踩坑场景（见后文）。

## computed 的缓存与失效

### 计算属性的缓存机制

computed 是 Vue 响应式系统中最容易被误解的部分。很多人以为「computed 会自动缓存结果」，但具体缓存什么、何时失效，往往说不清楚。

computed 的本质是一个「带缓存的 effect」。它内部维护两个东西：`_value`（缓存的结果）和 `_dirty`（脏标记）。当 computed 被访问时：

1. 如果 `_dirty` 为 true，重新执行计算函数，更新 `_value`，把 `_dirty` 设为 false。
2. 如果 `_dirty` 为 false，直接返回 `_value`。

那 `_dirty` 何时变回 true？当 computed 依赖的任何响应式数据变化时，会触发一个 scheduler（而不是直接重新计算），scheduler 把 `_dirty` 设为 true，并通知所有依赖这个 computed 的 effect 重新运行。

这个设计的精妙之处在于：**computed 只在被访问时才计算**。如果一个 computed 依赖的数据变了，但没有任何 effect 在用这个 computed，那么它永远不会重新计算（只是 `_dirty` 被标记为 true 而已）。

```javascript
import { ref, computed } from 'vue';

const firstName = ref('张');
const lastName = ref('三');

const fullName = computed(() => {
  console.log('computed 执行');
  return firstName.value + lastName.value;
});

// 场景一：没有任何 effect 访问 fullName
firstName.value = '李'; // 不打印 "computed 执行"
lastName.value = '王'; // 不打印

// 场景二：有 effect 访问
effect(() => {
  console.log('全名:', fullName.value);
});
// 打印：
// computed 执行
// 全名: 王王  (注意：上一步已经把 lastName 改成 王了)

firstName.value = '赵';
// 打印：
// computed 执行
// 全名: 赵王
```

注意场景二里一个微妙之处：`firstName` 改了，computed 重新计算，但如果在同一轮事件循环里 `lastName` 也改了，computed 只会重新计算一次（合并更新）。这是 Vue 响应式系统的批量更新机制——所有触发都在下一个微任务里统一处理。

### Vue 3.5 的版本号优化

在 Vue 3.5 之前，computed 的缓存失效判断比较粗暴：只要任何依赖变了，`_dirty` 就设为 true。这导致一个常见问题——「computed 过度计算」：

```javascript
const list = ref([1, 2, 3]);
const flag = ref(true);

// 这个 computed 依赖 list，但只在 flag 为 true 时使用 list
const display = computed(() => {
  return flag.value ? list.value.join(',') : 'disabled';
});

effect(() => {
  console.log(display.value);
});

flag.value = false; // display 变成 'disabled'
list.value.push(4); // 3.4 之前：display 重新计算（虽然结果还是 'disabled'）
// 3.5：由于版本号链表，display 知道 list 变了但结果不变，跳过
```

Vue 3.5 引入了基于版本号的更精细的失效判断。每个响应式对象有一个全局递增的版本号，computed 也维护一个版本号。当 computed 重新计算时，它会记录自己依赖的所有对象的版本号；下次访问时，如果所有依赖的版本号都没变，直接返回缓存，连「重新计算后结果是否一样」都不需要判断。

这个机制对深层嵌套的 computed 链尤其有效。假设你有 `a -> b -> c -> d` 这样一条 computed 链，每层都依赖上一层。在 3.4 之前，只要 `a` 变了，b、c、d 都要重新计算；在 3.5 中，如果 `a` 变了但 `b` 的计算结果没变（版本号没递增），c 和 d 都会跳过。

### computed 的 setter

computed 默认是只读的，但可以提供 setter：

```javascript
const fullName = computed({
  get: () => firstName.value + ' ' + lastName.value,
  set: (newVal) => {
    [firstName.value, lastName.value] = newVal.split(' ');
  },
});

fullName.value = '李 四';
// firstName 变成 '李'，lastName 变成 '四'
```

实战中，computed 的 setter 用得不多，但在双向绑定的场景下很有用。比如一个表单字段，既要根据其他字段计算显示值，又要允许用户修改并回写到原始字段。

### 不要在 computed 中产生副作用

这是最常见的误用之一。computed 应该是纯函数，不应在里面发请求、改全局状态、操作 DOM。原因有二：

第一，computed 可能被批量更新跳过，你的副作用可能不执行。

第二，computed 可能被多次访问但只计算一次，副作用执行的时机不可控。

如果需要副作用，用 `watch` 或 `watchEffect`。它们的语义就是「当依赖变化时执行副作用」，时机明确。

```javascript
// 错误：在 computed 里发请求
const userInfo = computed(() => {
  fetch('/api/user/' + userId.value); // 每次 userId 变都会发请求，但 computed 可能被跳过
  return cachedUser;
});

// 正确：用 watch
watch(userId, (newId) => {
  fetch('/api/user/' + newId).then((user) => {
    userInfo.value = user;
  });
});
```

## shallowRef / shallowReactive：性能优化

### 浅层响应式的适用场景

默认情况下，ref 和 reactive 都是深层的：`ref({ a: { b: 1 } })` 后修改 `.value.a.b = 2` 也能触发更新。这个深层响应式很方便，但对大型对象有性能代价——每次访问都会递归地把内部对象转成响应式 Proxy。

`shallowRef` 和 `shallowReactive` 提供浅层响应式：

- `shallowReactive(obj)`：只有 `obj` 自身的顶层属性是响应式的，嵌套对象不是。
- `shallowRef(value)`：只有 `.value` 的替换是响应式的，`.value` 内部的修改不触发更新。

什么时候用？我总结了几个实战场景：

1. **大型只读数据展示**：比如一份 10000 条记录的表格，数据从接口拉下来后不再修改内部字段，只是整体替换。用 `shallowRef` 比深层 ref 快得多。
2. **第三方实例的挂载对象**：比如 ECharts 的 option，你只需要整体响应式，不需要 Vue 去代理 option 内部的每一层。
3. **性能敏感的列表渲染**：列表项的数据如果不需要深层响应，用 shallowReactive 可以减少 Proxy 创建开销。

下面是一个具体的性能对比：

```javascript
import { ref, shallowRef, isProxy } from 'vue';

// 1. 深层 ref：内部对象被 reactive 包裹
const deep = ref({
  list: Array(10000)
    .fill(0)
    .map((_, i) => ({ id: i })),
});
console.log(isProxy(deep.value.list[0])); // true，每个元素都是 Proxy

// 2. shallowRef：内部对象保持原始状态
const shallow = shallowRef({
  list: Array(10000)
    .fill(0)
    .map((_, i) => ({ id: i })),
});
console.log(isProxy(shallow.value.list[0])); // false，原始对象
```

对于 10000 个元素的对象，shallowRef 的初始化几乎瞬时，而深层 ref 需要递归创建大量 Proxy（虽然惰性，但首次访问全部元素时开销明显）。

### shallowRef 的更新触发

shallowRef 的关键特性是：**修改 `.value` 的属性不会触发更新，只有替换 `.value` 才会**。这常常让初学者踩坑：

```javascript
import { shallowRef, watchEffect } from 'vue';

const state = shallowRef({ count: 0 });

watchEffect(() => {
  console.log('count:', state.value.count);
});
// 打印：count: 0

state.value.count = 1; // 不触发更新！shallowRef 不深层响应
console.log(state.value.count); // 1（数据改了，但视图没更新）

// 正确的更新方式：整体替换
state.value = { count: 2 }; // 触发更新，打印 count: 2
```

如果你想「修改内部属性也触发更新」，但又不想用深层 ref（出于性能考虑），可以用 `triggerRef` 手动触发：

```javascript
import { shallowRef, triggerRef } from 'vue';

const state = shallowRef({ list: [] });

function addItem(item) {
  state.value.list.push(item); // 直接改内部
  triggerRef(state); // 手动通知 shallowRef 的依赖
}
```

这个模式在「数据量大但更新频率低」的场景下很有用：平时用 shallowRef 节省开销，需要更新时整体替换或 triggerRef。

### shallowReactive 的边界

shallowReactive 的语义是「只有顶层属性是响应式的」。这意味着：

```javascript
import { shallowReactive, watchEffect } from 'vue';

const state = shallowReactive({
  user: { name: '张三' },
  count: 0,
});

watchEffect(() => {
  console.log('user:', state.user.name, 'count:', state.count);
});
// 打印：user: 张三 count: 0

state.count = 1; // 触发更新（count 是顶层属性）
state.user.name = '李四'; // 不触发更新（user 是顶层属性，但 name 是嵌套）

// 替换顶层属性触发更新
state.user = { name: '王五' }; // 触发更新
```

这里有个容易混淆的点：`state.user = {...}` 触发更新，是因为 `user` 是顶层属性，它的 set 被 Proxy 拦截；而 `state.user.name = '李四'` 不触发，因为 `state.user` 是原始对象（没被 reactive 包裹），它的属性修改不被拦截。

实战中，shallowReactive 适合「顶层结构稳定、内部数据可能大」的场景。比如一个配置对象，顶层有 `theme`、`locale`、`features` 等键，每个键对应一个可能很大的子对象——这种结构用 shallowReactive 既能响应顶层切换，又避免了递归 Proxy 的开销。

## watch 与 watchEffect 的语义差异

### 三种侦听器的本质区别

Vue 3 提供了三个侦听器 API：`watch`、`watchEffect`、`watch` 配合 getter。它们的语义差异常被混淆，导致代码意图不清。

| API           | 触发时机          | 依赖收集       | 旧值访问 | 立即执行   |
| ------------- | ----------------- | -------------- | -------- | ---------- |
| watchEffect   | 依赖变化          | 自动（运行时） | 无       | 默认立即   |
| watch(ref)    | ref.value 变化    | 显式（传入源） | 有       | 默认不立即 |
| watch(getter) | getter 返回值变化 | 显式           | 有       | 默认不立即 |

核心区别在于「依赖收集方式」：

- `watchEffect` 在运行时自动收集所有访问过的响应式数据作为依赖，类似一个不带返回值的 computed。
- `watch` 需要你显式传入「数据源」（一个 ref、一个返回值的 getter 函数，或它们的数组），它只侦听这些源。

```javascript
import { ref, watch, watchEffect } from 'vue';

const a = ref(0);
const b = ref(0);

// watchEffect：自动追踪 a 和 b
watchEffect(() => {
  console.log('a+b =', a.value + b.value);
});

// watch：只侦听 a，不关心 b
watch(a, (newVal, oldVal) => {
  console.log('a changed:', oldVal, '->', newVal);
});

// watch getter：侦听 a+b 的结果
watch(
  () => a.value + b.value,
  (newVal, oldVal) => {
    console.log('sum changed:', oldVal, '->', newVal);
  },
);
```

选择哪种？我的经验法则是：

- 需要访问旧值、需要精确控制侦听源 → `watch`
- 副作用涉及多个响应式数据、不需要旧值 → `watchEffect`
- 侦听的值是计算得出的（比如 `a + b`）→ `watch` 配合 getter

### 深度侦听与 immediate

`watch` 有两个常用选项：`deep` 和 `immediate`。

`deep: true` 让 watch 递归遍历侦听源的所有嵌套属性，任何一个变化都触发回调。这对 reactive 对象很有用，但有性能代价——每次都要深比较。

```javascript
import { reactive, watch } from 'vue';

const state = reactive({
  user: { profile: { name: '张三' } },
});

// 不加 deep：只有 state.user = {...} 这种顶层替换才触发
// 加 deep：state.user.profile.name = '李四' 也触发
watch(
  () => state.user,
  (newVal, oldVal) => {
    console.log('user changed');
  },
  { deep: true },
);
```

注意一个陷阱：**使用 deep 时，newVal 和 oldVal 指向同一个对象**（因为 reactive 是引用类型，修改内部属性不会创建新对象）。所以 `oldVal === newVal` 可能为 true，你拿不到「真正的旧值」。如果需要比较差异，得自己深拷贝或者用 JSON.stringify 快照。

`immediate: true` 让 watch 在注册时立即执行一次回调。这常用于「初始化时也要执行逻辑」的场景，比如根据初始路由拉取数据：

```javascript
import { watch, ref } from 'vue';

const route = useRoute();
const data = ref(null);

watch(
  () => route.params.id,
  async (id) => {
    data.value = await fetch(`/api/item/${id}`);
  },
  { immediate: true },
);
```

### watchEffect 的清理逻辑

watchEffect 内部可能注册一些异步任务、定时器、事件监听。当 effect 重新运行或被停止时，需要清理这些资源。Vue 提供了 `onCleanup` 函数来注册清理逻辑：

```javascript
import { watchEffect, onCleanup } from 'vue';

watchEffect(() => {
  const controller = new AbortController();

  fetch(`/api/search?q=${keyword.value}`, {
    signal: controller.signal,
  })
    .then((res) => res.json())
    .then((data) => {
      results.value = data;
    });

  // 当 effect 重新运行或被停止时，执行这个清理函数
  onCleanup(() => {
    controller.abort(); // 取消未完成的请求
  });
});
```

这个模式在「自动完成搜索框」场景下几乎是必备的：用户输入时，watchEffect 触发搜索请求；如果用户继续输入导致 effect 重新运行，上一次的请求会被 abort 掉，避免过时结果覆盖最新结果。

Vue 3.5 对 onCleanup 做了一个小优化：清理函数现在通过 effect 的 deps 系统管理，而不是之前的独立数组，这减少了内存碎片。

### flush 时机：pre、post、sync

watch 和 watchEffect 都接受 `flush` 选项，控制回调的执行时机：

- `pre`（默认）：在组件更新前执行。
- `post`：在组件更新后执行（可以访问更新后的 DOM）。
- `sync`：同步执行，不进入队列。

```javascript
import { watch, ref } from 'vue';

const count = ref(0);

// pre：回调在 DOM 更新前运行，此时访问 DOM 是旧的
watch(
  count,
  () => {
    console.log('pre flush, DOM 未更新');
  },
  { flush: 'pre' },
);

// post：回调在 DOM 更新后运行，可以访问新 DOM
watch(
  count,
  () => {
    console.log('post flush, DOM 已更新');
    // 这里可以安全地测量元素尺寸
  },
  { flush: 'post' },
);
```

实战中，`post` 常用于「数据变化后需要操作 DOM」的场景，比如根据列表长度计算滚动位置。`sync` 几乎不用，因为它会让更新失去批量合并的能力，容易导致性能问题。

## 踩坑案例：6 个真实生产场景

理论讲完了，下面是 6 个我在真实项目中遇到（或帮人排查过）的踩坑案例。每个都附带了「症状、原因、修复」三段式说明。

### 案例 1：reactive 解构丢失响应性

**症状**：在 setup 中对 reactive 对象解构后，修改属性不再触发视图更新。

```javascript
import { reactive } from 'vue';

// 错误代码
const state = reactive({ count: 0, name: 'test' });
const { count, name } = state; // 解构

// 模板中使用 count 和 name
// 修改 state.count 后，视图不更新
```

**原因**：解构把 `count` 从「对 state.count 的响应式访问」变成了「一个普通的数字变量」。`const { count } = state` 等价于 `const count = state.count`，后者只是一次性的值拷贝，与响应式系统无关。

**修复**：用 `toRefs` 把 reactive 的每个属性转成 ref，解构后保持响应性。

```javascript
import { reactive, toRefs } from 'vue';

const state = reactive({ count: 0, name: 'test' });
const { count, name } = toRefs(state); // count 和 name 现在是 ref

// 修改 state.count 后，count.value 也变，视图更新
// 或直接通过 state.count 修改
```

更推荐的做法是直接用 ref 替代 reactive，避免解构问题：

```javascript
import { ref } from 'vue';

const count = ref(0);
const name = ref('test');
// 直接解构（其实没解构），都是独立的 ref
```

### 案例 2：watch 监听 reactive 对象不触发

**症状**：监听一个 reactive 对象，修改其嵌套属性后回调不执行。

```javascript
import { reactive, watch } from 'vue';

const state = reactive({
  user: { name: '张三' },
});

watch(state, () => {
  console.log('state changed'); // 永远不打印
});

state.user.name = '李四'; // 不触发
state.user = { name: '王五' }; // 不触发
```

**原因**：`watch(state, ...)` 把 `state` 作为源。但 reactive 对象作为 watch 源时，Vue 只在「整体引用变化」时触发，而 reactive 的整体引用永远不变（它是 Proxy 包裹的固定对象）。修改内部属性不会让「state 这个引用」发生变化。

**修复**：用 getter 形式返回想监听的对象，并加上 `deep` 选项。

```javascript
watch(
  () => state.user,
  (newVal, oldVal) => {
    console.log('user changed:', newVal);
  },
  { deep: true },
);
```

或者直接监听具体属性：

```javascript
watch(
  () => state.user.name,
  (newVal, oldVal) => {
    console.log('name changed:', oldVal, '->', newVal);
  },
);
```

### 案例 3：ref 数组在 reactive 中的解包陷阱

**症状**：把一个 ref 放进 reactive 数组，访问时拿到的不是原始值，导致后续逻辑出错。

```javascript
import { ref, reactive } from 'vue';

const item1 = ref('a');
const item2 = ref('b');

const list = reactive([item1, item2]);

// 期望：list[0] 是字符串 'a'
// 实际：list[0] 是 RefImpl 对象（数组元素不解包）
console.log(list[0]); // RefImpl<'a'>
console.log(list[0].value); // 'a'

// 但如果 ref 是对象属性，会解包：
const obj = reactive({ item: ref('c') });
console.log(obj.item); // 'c'，自动解包
```

**原因**：Vue 的 reactive 解包逻辑对「数组元素中的 ref」不做解包。这是设计上的权衡（避免数组访问类型不稳定），但对使用者来说是个陷阱。

**修复**：避免在 reactive 数组中放 ref。如果确实需要每项都是独立的响应式单元，用 `shallowReactive` 包裹数组，自己管理每个元素的更新：

```javascript
import { ref, shallowReactive } from 'vue';

// 方案一：用普通数组，每项是 ref
const list = shallowReactive([]);
function addItem(val) {
  list.push(ref(val));
}
// 访问 list[0].value，修改也是 list[0].value = ...

// 方案二：用对象数组，每个对象的属性是响应式
const list = reactive([]);
function addItem(val) {
  list.push({ value: val }); // 整个对象都是响应式的
}
```

### 案例 4：computed 中异步操作的「假更新」

**症状**：computed 里用了 async/await 或 Promise，结果视图显示的是 Promise 对象，或者更新时序错乱。

```javascript
import { ref, computed } from 'vue';

const userId = ref(1);

// 错误：computed 里用 async
const userInfo = computed(async () => {
  const res = await fetch(`/api/user/${userId.value}`);
  return res.json();
});
// userInfo.value 是一个 Promise，不是用户数据
// 模板里显示 [object Promise]
```

**原因**：computed 期望 getter 返回同步值。如果你返回 Promise，computed 会把这个 Promise 当作结果缓存起来——但 Promise 不会触发 computed 重新计算（因为它不是响应式数据），所以后续的 resolve 不会让 computed 更新。

**修复**：用 `watch` + `ref` 处理异步，或者用第三方库如 `vueuse` 的 `useAsyncState`。

```javascript
import { ref, watch } from 'vue';

const userId = ref(1);
const userInfo = ref(null);
const loading = ref(false);

async function loadUser(id) {
  loading.value = true;
  try {
    const res = await fetch(`/api/user/${id}`);
    userInfo.value = await res.json();
  } finally {
    loading.value = false;
  }
}

watch(userId, (id) => loadUser(id), { immediate: true });
```

或者用 vueuse 的 `useAsyncState`，代码更简洁：

```javascript
import { useAsyncState } from '@vueuse/core';

const { state: userInfo, isLoading } = useAsyncState(
  (id) => fetch(`/api/user/${id}`).then((r) => r.json()),
  null,
  { immediate: true, initialData: null },
);
```

### 案例 5：shallowRef 修改内部属性不更新

**症状**：用 shallowRef 存了一个对象，修改对象的属性后视图不更新。

```javascript
import { shallowRef, watchEffect } from 'vue';

const form = shallowRef({
  username: '',
  password: '',
});

watchEffect(() => {
  console.log('form:', form.value);
});

// 错误：直接修改内部属性
form.value.username = 'admin'; // 数据变了，但 watchEffect 不触发

// 用户在输入框输入，但表单状态一直显示初始值
```

**原因**：shallowRef 只对 `.value` 的整体替换响应式，内部属性的修改不会被 Proxy 拦截（因为 shallowRef 不会把内部对象转成 reactive）。

**修复**：要么整体替换 `.value`，要么用 `triggerRef` 手动触发，要么改用深层 ref。

```javascript
// 方案一：整体替换（推荐，符合 shallowRef 的设计意图）
form.value = { ...form.value, username: 'admin' };

// 方案二：手动触发（适合批量修改后一次性更新）
form.value.username = 'admin';
form.value.password = '123456';
triggerRef(form); // 一次性触发

// 方案三：改用 ref（如果对象很小，性能差异可忽略）
const form = ref({ username: '', password: '' });
form.value.username = 'admin'; // 正常触发，因为 ref 会把内部转 reactive
```

实战中，我会根据「修改频率」选择方案：修改频繁且对象大 → shallowRef + 整体替换；修改不频繁但对象大 → shallowRef + triggerRef；对象小 → 普通 ref。

### 案例 6：循环依赖的 computed 导致无限递归

**症状**：两个 computed 互相引用，控制台报 `Maximum recursive calls exceeded` 或页面无响应。

```javascript
import { ref, computed } from 'vue';

const a = computed(() => b.value + 1); // a 依赖 b
const b = computed(() => a.value + 1); // b 依赖 a

console.log(a.value); // 无限递归：a 计算 -> 依赖 b -> b 计算 -> 依赖 a -> a 计算...
```

**原因**：computed 之间形成循环依赖时，访问任意一个都会触发无限递归计算。Vue 内部没有针对 computed 循环依赖的检测（因为它在静态分析层面无法可靠检测）。

**修复**：打破循环依赖。通常的做法是把「共享的状态」提取出来作为独立的 ref，让两个 computed 都依赖它而不是互相依赖。

```javascript
import { ref, computed } from 'vue';

const base = ref(0);

const a = computed(() => base.value + 1); // a 依赖 base
const b = computed(() => base.value + 2); // b 依赖 base

console.log(a.value, b.value); // 1 2，正常
base.value = 10;
console.log(a.value, b.value); // 11 12，正常更新
```

更复杂的场景下，可能需要重新审视数据模型——循环依赖往往意味着数据结构设计有问题。比如上面的 a、b 如果表示「彼此相关的两个值」，那应该用一个 reactive 对象统一管理，而不是两个独立的 computed 互相引用。

## 总结

Vue 3.5 的响应式系统在保留 3.x API 兼容性的同时，底层做了相当大的重构。回顾全文，几个关键点值得反复咀嚼：

**第一，理解 Proxy + effect 的基本机制。** reactive 用 Proxy 拦截 get/set，在 get 里收集依赖（track），在 set 里触发更新（trigger）。effect 是副作用的容器，它在执行时自动收集依赖。所有的 watch、computed、渲染函数底层都是 effect。

**第二，ref 和 reactive 的选择不是风格问题，而是语义问题。** 原始类型必须用 ref；需要整体替换的对象用 ref；表单、配置等属性访问密集的对象用 reactive。混用时注意 ref 在 reactive 中的自动解包行为，以及 reactive 解构丢失响应性的陷阱。

**第三，computed 是带缓存的 effect，不是「会自动更新的变量」。** 它的缓存基于版本号链表（3.5 的新机制），失效时机精确可控。永远不要在 computed 里写副作用——那应该交给 watch/watchEffect。

**第四，shallowRef 和 shallowReactive 是性能优化工具，不是默认选择。** 它们适合大型对象、第三方实例的挂载数据、性能敏感的列表渲染。使用时牢记「浅层」的含义：shallowRef 只有整体替换响应式，shallowReactive 只有顶层属性响应式。

**第五，watch 和 watchEffect 的区别在于「依赖收集方式」。** watchEffect 自动追踪，watch 需要显式指定源。深度侦听用 `deep: true`，初始化执行用 `immediate: true`，DOM 更新后执行用 `flush: 'post'`。

**第六，踩坑的本质往往是「心智模型与实际行为不一致」。** 解构丢失响应性是因为没理解 reactive 的 Proxy 是针对对象整体的；watch 监听 reactive 不触发是因为没理解 reactive 的引用永远不变；shallowRef 修改属性不更新是因为没理解「浅层」到底浅在哪里。把这些底层行为搞清楚，大部分坑都能提前规避。

Vue 的响应式系统是这门框架最核心的设计，也是最容易让人困惑的部分。它用一套统一的抽象（ref/reactive/computed/effect）覆盖了从原始类型到嵌套对象、从同步计算到异步侦听的各种场景，但这套抽象的边界条件并不少。希望这篇文章能帮你建立起对 Vue 3.5 响应式系统的精确心智模型，在生产环境中少踩几个坑。

最后给一个建议：如果你的项目还在 Vue 3.0-3.3，强烈建议规划升级到 3.5+。除了响应式系统的性能优化，3.4 引入的 `defineModel`、3.5 引入的 `useTemplateRef` 和响应式 props 解构等特性，都能显著提升开发体验。升级时重点关注「自定义渲染器 API 变更」和「部分废弃 API」的迁移指南，响应式相关的 API 在 3.x 系列内是稳定兼容的。
