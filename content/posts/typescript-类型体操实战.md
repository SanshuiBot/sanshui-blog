---
title: TypeScript 类型体操实战：从 Conditional Types 到 Template Literal Types
date: 2026-07-21
tags: [TypeScript, 前端, 技术]
excerpt: 通过 10 个由浅入深的实战案例，彻底掌握 TypeScript 类型系统的高级用法，写出真正类型安全的代码。
---

# TypeScript 类型体操实战：从 Conditional Types 到 Template Literal Types

TypeScript 5.x 的类型系统已经图灵完备，能在编译期进行复杂的类型计算。但很多人写出的 TS 代码依然停留在"给变量加 `: string`"的层面。这篇文章通过 10 个由浅入深的实战案例，带你彻底掌握类型体操。

## 一、Conditional Types：类型层面的 if-else

Conditional Types 是类型体操的基石。语法如下：

```typescript
T extends U ? X : Y
```

读作："如果 T 能赋值给 U，那么结果是 X，否则是 Y"。

### 1.1 实战：IsAny

判断一个类型是不是 `any`，这是类型体操的经典开场：

```typescript
type IsAny<T> = 0 extends 1 & T ? true : false;

type T1 = IsAny<any>;     // true
type T2 = IsAny<string>;  // false
type T3 = IsAny<unknown>; // false
```

**关键点**：`1 & any` 等于 `any`，而 `0 extends any` 是 `true`。这是 any 在条件类型中的特殊行为——条件类型中若有一方是 any，结果直接是两个分支的 union。

### 1.2 实战：IsNever

`never` 是所有类型的子类型，但在条件类型中有个"坑"：

```typescript
// 错误版本
type IsNever1<T> = T extends never ? true : false;
type R = IsNever1<never>; // never —— 而不是 true！

// 正确版本：用 [T] 包裹
type IsNever<T> = [T] extends [never] ? true : false;
type R2 = IsNever<never>; // true
```

为什么？因为 `T extends never` 当 T 是 never 时，会触发**分布式条件类型**的空集规则——直接返回 never。用 `[T] extends [never]` 把 T 包进元组，阻止了分布。

## 二、Distributed Conditional Types：分布的魔法

当裸类型参数（naked type parameter）被传给 `extends` 时，TS 会先把 union "展开"，对每个成员分别应用条件类型，再把结果 union 起来。

### 2.1 实战：Exclude 与 Extract 的实现

```typescript
type MyExclude<T, U> = T extends U ? never : T;
type MyExtract<T, U> = T extends U ? T : never;

type T1 = MyExclude<'a' | 'b' | 'c', 'a'>;      // 'b' | 'c'
type T2 = MyExtract<'a' | 'b' | 'c', 'a' | 'b'>; // 'a' | 'b'
```

执行过程：
- `MyExclude<'a' | 'b' | 'c', 'a'>` 先展开成 `'a' extends 'a' ? never : 'a'` | `'b' extends 'a' ? ...` | `'c' extends 'a' ? ...`
- 'a' 的分支返回 `never`，'b' 和 'c' 返回自身
- 最后 union：`never | 'b' | 'c'` = `'b' | 'c'`

### 2.2 实战：实现一个 UnionToTuple

这是难度更高的题目——把 union 类型转成 tuple：

```typescript
type LastInUnion<U> =
  UnionToIntersection<U extends unknown ? (x: U) => void : never>
  extends (x: infer L) => void
    ? L
    : never;

type UnionToTuple<U, Last = LastInUnion<U>> =
  [U] extends [never] ? [] : [...UnionToTuple<Exclude<U, Last>>, Last];

type Result = UnionToTuple<'a' | 'b' | 'c'>;
// 大致为 ['a', 'b', 'c']（顺序由 TS 内部决定）
```

这里出现了两个关键技巧：
- `UnionToIntersection`：利用函数参数的逆变位置，把 union 转成 intersection
- 递归 + `Exclude`：每次"弹出"union 的最后一个成员

## 三、Mapped Types 与 Key Remapping

### 3.1 实战：实现 Mutable

把一个 readonly 对象的所有属性变成可变：

```typescript
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

interface Props {
  readonly id: number;
  readonly name: string;
}

type M = Mutable<Props>;
// { id: number; name: string; }
```

`-readonly` 是减号修饰符，类似还有 `-?`（移除 optional）和 `+?`/`+readonly`。

### 3.2 实战：用 Key Remapping 实现 Getter 命名

TypeScript 4.1 引入了 `as` 子句，能在 Mapped Types 中重命名 key：

```typescript
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
/*
{
  getName: () => string;
  getAge: () => number;
}
*/
```

## 四、Template Literal Types：字符串层面的类型计算

Template Literal Types 让我们能对字符串类型做拼接、提取、变换。

### 4.1 实战：实现 CamelCase

把 `kebab-case` 或 `snake_case` 转成 `camelCase`：

```typescript
type CamelCase<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<CamelCase<Tail>>}`
    : S;

type R1 = CamelCase<'hello_world'>;       // 'helloWorld'
type R2 = CamelCase<'user_first_name'>;  // 'userFirstName'
```

每次匹配 `Head_Tail`，把 Head 保留，对 Tail 递归处理并首字母大写。

### 4.2 实战：从 Schema 推导类型

模拟一个轻量的 schema-to-type：

```typescript
type Schema = {
  id: 'number';
  name: 'string';
  tags: 'string[]';
  active: 'boolean';
};

type SchemaToType<S> = {
  [K in keyof S]: S[K] extends 'number' ? number
    : S[K] extends 'string' ? string
    : S[K] extends 'boolean' ? boolean
    : S[K] extends `${infer T}[]` ? Array<SchemaToType<{ x: T }>['x']>
    : never;
};

type Entity = SchemaToType<Schema>;
/*
{
  id: number;
  name: string;
  tags: string[];
  active: boolean;
}
*/
```

## 五、infer 关键字：在条件类型中"捕获"类型

`infer` 让我们在 extends 子句中声明一个类型变量，并从被检查的类型中提取它。

### 5.1 实战：ReturnType 与 Parameters

```typescript
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;

function foo(x: number, y: string): boolean { return true; }

type R1 = MyReturnType<typeof foo>; // boolean
type R2 = MyParameters<typeof foo>; // [number, string]
```

### 5.2 实战：DeepPartial

递归地把所有属性变成 optional：

```typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

interface Config {
  server: {
    port: number;
    host: string;
  };
  debug: boolean;
}

type PartialConfig = DeepPartial<Config>;
/*
{
  server?: {
    port?: number;
    host?: string;
  };
  debug?: boolean;
}
*/
```

注意 `T[K] extends object` 的边界——遇到 null 或函数会停止递归。生产中通常要加更多分支：

```typescript
type DeepPartialPro<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartialPro<T[K]> }
    : T;
```

## 六、类型递归的边界

TypeScript 对递归类型有实例化深度限制（默认 50，TS 4.5+ 提高了上限）。无限递归会报错：

```typescript
// 这个会报错：Type instantiation is excessively deep
type Infinite<T> = Infinite<T>;
```

**实战建议**：
- 涉及深嵌套类型时，先用单元测试验证类型推断
- 用 `// @ts-expect-error` 跑负向测试，确保错误被正确捕获
- 真正复杂的类型运算，考虑用 codegen（比如从 GraphQL schema 生成 TS 类型）

## 七、综合实战：类型安全的路由系统

把前面学到的全部用上——构建一个类型安全的路由表：

```typescript
type Routes = '/users' | '/users/:id' | '/posts' | '/posts/:id/comments';

// 提取路径参数
type PathParams<Path> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & PathParams<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {};

// 类型安全的导航函数
function navigate<Path extends Routes>(
  path: Path,
  params: PathParams<Path>
): void {
  // 运行时实现
  let url = path;
  for (const key in params) {
    url = url.replace(`:${key}`, params[key]);
  }
  window.history.pushState(null, '', url);
}

// 调用——参数错误会在编译期报错
navigate('/users/:id', { id: '123' });      // ✅
navigate('/users/:id', {});                  // ❌ 缺少 id
navigate('/posts/:id/comments', { id: '1' });// ✅
```

这个例子综合运用了：Template Literal Types、infer、Conditional Types、Mapped Types。

## 八、性能与可读性的平衡

类型体操很酷，但**不是越多越好**。判断标准：

1. **类型推导是否给使用者带来价值？** 调用方少时，简单 union + 注释足够。
2. **类型错误信息是否可读？** 复杂类型推导失败时，TS 给出的错误信息可能像天书。
3. **编译速度是否可接受？** 复杂泛型可能让 tsc 慢 10 倍以上。

实际项目里，80% 的场景只需要：
- 简单的泛型函数
- `Pick` / `Omit` / `Partial` / `Readonly` 等内置工具
- 给 API 响应定义 interface

剩下 20% 的复杂场景才需要类型体操。

## 九、延伸阅读

- TypeScript 官方 handbook：[Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)、[Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [type-fest](https://github.com/sindresorhus/type-fest)：常用类型工具集合
- [ts-toolbelt](https://github.com/millsp/ts-toolbelt)：更激进的类型工具库
- [type-challenges](https://github.com/type-challenges/type-challenges)：刷题巩固

## 十、结语

类型体操的真正价值，不在于写出炫酷的 `extends` 链，而在于**让类型系统替你捕捉 bug**。当你能写出一个"使用方必须提供正确参数类型，否则编译失败"的函数时，整个团队的开发体验都会上一个台阶。

掌握 Conditional Types、Mapped Types、Template Literal Types、infer 这四大金刚，你就掌握了类型体操 90% 的能力。剩下的 10%，是阅读 type-fest 源码、刷 type-challenges 时自然获得的肌肉记忆。

> 下一篇预告：《云原生架构与 Kubernetes 实战：从 Pod 到 Service Mesh》
