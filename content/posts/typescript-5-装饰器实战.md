---
title: TypeScript 5.x 装饰器实战：从元数据到依赖注入
date: 2026-07-18
tags: [TypeScript, 前端, 技术]
excerpt: TS 5.0 标准化装饰器，与旧 reflect-metadata 方案完全不同。本文讲新装饰器 API、metadata 提案、手写一个 IoC 容器，再到 NestJS 风格的路由装饰器实现。
---

# TypeScript 5.x 装饰器实战：从元数据到依赖注入

TypeScript 5.0 把装饰器正式标准化，与旧的「experimentalDecorators + reflect-metadata」方案完全分道扬镳。但社区文档大多还停留在旧方案，导致很多人写出的装饰器代码在新标准下根本编译不过。这篇文章会从零讲新装饰器，并手写一个完整的 IoC 容器。

## 一、新旧装饰器的核心差异

| 维度 | 旧（experimentalDecorators） | 新（TS 5.0 标准） |
| --- | --- | --- |
| 启用方式 | `experimentalDecorators: true` | 默认开启 |
| 元数据 | `reflect-metadata` + `design:paramtypes` | 内置 `Symbol.metadata` |
| 装饰器顺序 | 自底向上 | 自顶向下 |
| 参数装饰器 | 支持 | 5.0 不支持，需等后续提案 |

**关键陷阱**：两者不能混用。一个项目要么全用新装饰器，要么全用旧方案。

## 二、新装饰器的基本语法

```ts
// 方法装饰器
function log(target: any, context: ClassMethodDecoratorContext) {
  const methodName = String(context.name)
  return function (this: any, ...args: any[]) {
    console.log(`[LOG] calling ${methodName}`)
    return target.apply(this, args)
  }
}

class Service {
  @log
  fetch(id: string) {
    return api.get(id)
  }
}
```

新装饰器的签名变了：

- 第二个参数是 `ClassMethodDecoratorContext`（旧版是 `PropertyDescriptor`）
- 上下文包含 `name` / `kind` / `addInitializer` 等元信息
- 装饰器可以**返回一个新函数**替换原方法

## 三、context.kind 的六种值

```ts
type DecoratorContext =
  | ClassMethodDecoratorContext
  | ClassGetterDecoratorContext
  | ClassSetterDecoratorContext
  | ClassFieldDecoratorContext
  | ClassAccessorDecoratorContext
  | ClassDecoratorContext
```

每种 context 都有 `kind` 字段标识：

- `'method'` —— 普通方法
- `'getter'` / `'setter'` —— 访问器
- `'field'` —— 类字段
- `'accessor'` —— `accessor` 关键字字段
- `'class'` —— 整个类

## 四、类装饰器实战：自动注册

```ts
const registry = new Map<string, new () => any>()

function Component(name?: string) {
  return function (target: new () => any, context: ClassDecoratorContext) {
    const componentName = name ?? context.name
    registry.set(componentName, target)
    return target
  }
}

@Component('user-service')
class UserService {
  getUser() { return { id: 1, name: 'San' } }
}

@Component()
class PostService {
  getPost() { return { id: 1, title: 'Hello' } }
}

console.log(registry.get('user-service')) // UserService
console.log(registry.get('PostService'))  // PostService
```

## 五、字段装饰器 + accessor：响应式状态

新装饰器引入 `accessor` 关键字，配合装饰器可以优雅地实现响应式字段：

```ts
function reactive<T>(target: T, context: ClassAccessorDecoratorContext<T>) {
  const { get, set } = target
  return {
    get(this: any) {
      console.log('read reactive')
      return get.call(this)
    },
    set(this: any, value: T) {
      console.log('write reactive')
      set.call(this, value)
      // 触发 UI 更新
      this.notify?.()
    },
  } satisfies ClassAccessorDecoratorTarget<T, T>
}

class Store {
  @reactive accessor count = 0
}
```

注意 `accessor` 关键字会自动生成 getter/setter，装饰器拿到的是 `{ get, set }` 对象，返回新的 `{ get, set }` 替换。

## 六、metadata：新装饰器的元数据机制

旧装饰器用 `reflect-metadata` 在 `design:paramtypes` 等键上存类型信息。新装饰器引入 `Symbol.metadata` 作为统一元数据入口。

```ts
// 需要在 tsconfig 启用
// "target": "es2022"
// "experimentalDecorators": false（默认）
// 还需要 polyfill Symbol.metadata
declare global {
  interface SymbolConstructor {
    readonly metadata: unique symbol
  }
}
;(Symbol as any).metadata ??= Symbol('Symbol.metadata')
```

然后装饰器里可以通过 `context.metadata` 读写元数据：

```ts
function Route(path: string) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    context.metadata.path = path
    context.metadata.handler = target
  }
}

function Controller(base: string) {
  return function (target: any, context: ClassDecoratorContext) {
    context.metadata.base = base
    context.metadata.routes = []
    // 收集方法上的路由信息
  }
}
```

## 七、手写一个 IoC 容器

目标：

```ts
@Injectable()
class Logger {
  log(msg: string) { console.log(msg) }
}

@Injectable()
class UserService {
  constructor(private logger: Logger) {}

  hello() {
    this.logger.log('hello from UserService')
  }
}

const container = new Container()
container.register(Logger)
container.register(UserService, [Logger])

const user = container.resolve(UserService)
user.hello() // hello from UserService
```

实现：

```ts
type Constructor<T = any> = new (...args: any[]) => T

class Container {
  private registry = new Map<Constructor, { instance: any; deps: Constructor[] }>()

  register<T>(cls: Constructor<T>, deps: Constructor[] = []) {
    this.registry.set(cls, { instance: null, deps })
  }

  resolve<T>(cls: Constructor<T>): T {
    const entry = this.registry.get(cls)
    if (!entry) throw new Error(`未注册: ${cls.name}`)
    if (entry.instance) return entry.instance

    const deps = entry.deps.map((d) => this.resolve(d))
    entry.instance = new cls(...deps)
    return entry.instance
  }
}
```

但手动写依赖数组很啰嗦。用 metadata 自动推断：

```ts
function Injectable() {
  return function (target: Constructor, context: ClassDecoratorContext) {
    context.metadata.injectable = true
    context.metadata.target = target
    return target
  }
}
```

依赖类型怎么拿？这是新装饰器相比旧方案**最大的缺口**——旧方案的 `design:paramtypes` 能拿到构造函数参数类型，新标准暂时还没有等价机制。

临时方案：在 `@Injectable` 装饰器里手动声明依赖：

```ts
function Injectable(deps: Constructor[] = []) {
  return function (target: Constructor, context: ClassDecoratorContext) {
    context.metadata.deps = deps
    context.metadata.target = target
    return target
  }
}

@Injectable([Logger])
class UserService {
  constructor(private logger: Logger) {}
}
```

容器：

```ts
class Container {
  private registry = new Map<Constructor, any>()
  private metas: ClassDecoratorContext[] = []

  collect(metas: ClassDecoratorContext[]) {
    this.metas = metas
  }

  register<T>(cls: Constructor<T>) {
    const meta = this.metas.find((m) => (m.metadata as any).target === cls)
    if (!meta) throw new Error(`未收集 metadata: ${cls.name}`)
    const deps = (meta.metadata as any).deps as Constructor[]
    const instances = deps.map((d) => this.resolve(d))
    this.registry.set(cls, new cls(...instances))
  }

  resolve<T>(cls: Constructor<T>): T {
    if (this.registry.has(cls)) return this.registry.get(cls)
    this.register(cls)
    return this.registry.get(cls)
  }
}
```

## 八、实战案例：NestJS 风格路由装饰器

```ts
const routes: Array<{ method: string; path: string; handler: Function }> = []

function Get(path: string) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    routes.push({ method: 'GET', path, handler: target })
  }
}

function Post(path: string) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    routes.push({ method: 'POST', path, handler: target })
  }
}

@Controller('/api')
class UserController {
  @Get('/users')
  list() {
    return [{ id: 1 }]
  }

  @Post('/users')
  create() {
    return { id: 2 }
  }
}
```

然后启动一个简单的 HTTP server 把 `routes` 接起来即可。

## 九、装饰器顺序与组合

新装饰器的执行顺序是**自顶向下**（旧的相反）。组合多个装饰器时：

```ts
function A(target: any, context: ClassMethodDecoratorContext) {
  console.log('A called')
  return target
}

function B(target: any, context: ClassMethodDecoratorContext) {
  console.log('B called')
  return target
}

class S {
  @A
  @B
  m() {}
}
// 输出：
// B called
// A called
```

注意 B 先被求值（外层），A 后被求值（内层），但装饰器的实际「应用」顺序是按声明顺序。这是新标准的语义。

## 十、踩坑：装饰器里的 this 绑定

```ts
function log(target: any, context: ClassMethodDecoratorContext) {
  return function (...args: any[]) {
    console.log('calling', context.name)
    return target(...args) // ❌ 丢失 this
  }
}
```

正确写法是用 `.call(this, ...)` 或 `target.apply(this, args)`：

```ts
function log(target: any, context: ClassMethodDecoratorContext) {
  return function (this: any, ...args: any[]) {
    console.log('calling', context.name)
    return target.call(this, ...args)
  }
}
```

## 十一、踩坑：箭头函数装饰器

装饰器无法应用到箭头函数字段：

```ts
class S {
  @log onClick = () => {} // ❌ 编译错误
}
```

`@log` 装饰 `onClick` 字段，箭头函数本身不是被装饰对象。要用普通方法：

```ts
class S {
  @log onClick() {}
}
```

或者把箭头函数字段改为普通方法，把箭头函数语义交给调用方。

## 十二、总结

新装饰器相比旧方案的优势：

1. 标准化，无需 `experimentalDecorators`
2. context 提供完整元信息
3. `accessor` 关键字让响应式字段写起来很优雅
4. `addInitializer` 让装饰器能在类初始化时执行逻辑

劣势：

1. 元数据机制仍在提案阶段，需要 polyfill `Symbol.metadata`
2. 暂不支持参数装饰器（IoC 自动依赖推断因此受限）
3. 生态尚未跟上，很多库仍用旧方案

如果你在写一个新框架，强烈推荐直接采用新装饰器方案——这是未来的标准。如果维护现有 NestJS 项目，旧方案还得继续用一段时间。
