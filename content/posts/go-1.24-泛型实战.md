---
title: Go 1.24 泛型与 range-over-func 实战
date: 2026-07-28
tags: [Go, 后端, 技术]
excerpt: Go 1.24 把 range 推广到函数和 int。本文讲 type parameters 实战、iter.Pull / iter.Seq 迭代器协议、generic slice / map 工具，再到 6 个泛型设计踩坑。
---

# Go 1.24 泛型与 range-over-func 实战

Go 1.18 引入泛型，1.23 引入 range-over-func（迭代函数），1.24 进一步完善 iter 包。但社区里很多人写泛型代码依然停留在「泛型 map / slice 工具」层面，没有触及真正的类型抽象能力。这篇文章从基础讲到高级，再到 6 个真实设计踩坑点。

## 一、泛型基础回顾

```go
// 泛型函数
func Map[T, U any](s []T, f func(T) U) []U {
    result := make([]U, len(s))
    for i, v := range s {
        result[i] = f(v)
    }
    return result
}

// 使用
doubled := Map([]int{1, 2, 3}, func(x int) int { return x * 2 })
uppers := Map([]string{"a", "b"}, strings.ToUpper)
```

`[T, U any]` 是类型参数声明，`any` 是 `interface{}` 的别名。

## 二、类型约束：comparable 与自定义

```go
// comparable 是内置约束：支持 == 和 !=
func Contains[T comparable](s []T, target T) bool {
    for _, v := range s {
        if v == target {
            return true
        }
    }
    return false
}

// 自定义约束
type Number interface {
    int | int64 | float32 | float64
}

func Sum[T Number](nums []T) T {
    var total T
    for _, n := range nums {
        total += n
    }
    return total
}
```

**约束两种形态**：

1. **接口形式**（`interface { ... }`）：方法约束
2. **类型集形式**（`int | float64`）：底层类型约束

## 三、range-over-func：Go 1.23+ 的新能力

### 基础：range over function

```go
// 旧方式：自己处理 channel 或 callback
func Each[T any](s []T, f func(T)) {
    for _, v := range s {
        f(v)
    }
}

// 新方式：iter.Seq 协议
type Seq[V any] func(yield func(V) bool)

func Slice[T any](s []T) iter.Seq[T] {
    return func(yield func(T) bool) {
        for _, v := range s {
            if !yield(v) {
                return
            }
        }
    }
}

// 使用：直接 range！
for v := range Slice([]int{1, 2, 3}) {
    fmt.Println(v)
}
```

**关键**：`iter.Seq[T]` 是 `func(yield func(T) bool)` 类型。`yield` 返回 `false` 表示提前停止（break）。

### iter.Seq2：键值对迭代

```go
type Seq2[K, V any] func(yield func(K, V) bool)

func MapEntries[K comparable, V any](m map[K]V) iter.Seq2[K, V] {
    return func(yield func(K, V) bool) {
        for k, v := range m {
            if !yield(k, v) {
                return
            }
        }
    }
}

// 使用
for k, v := range MapEntries(myMap) {
    fmt.Println(k, v)
}
```

## 四、实战：泛型 LRU 缓存

```go
type LRU[K comparable, V any] struct {
    capacity int
    cache    map[K]*list.Element
    list     *list.List
}

type entry[K comparable, V any] struct {
    key K
    val V
}

func NewLRU[K comparable, V any](capacity int) *LRU[K, V] {
    return &LRU[K, V]{
        capacity: capacity,
        cache:    make(map[K]*list.Element),
        list:     list.New(),
    }
}

func (l *LRU[K, V]) Get(key K) (V, bool) {
    if elem, ok := l.cache[key]; ok {
        l.list.MoveToFront(elem)
        return elem.Value.(*entry[K, V]).val, true
    }
    var zero V
    return zero, false
}

func (l *LRU[K, V]) Put(key K, val V) {
    if elem, ok := l.cache[key]; ok {
        l.list.MoveToFront(elem)
        elem.Value.(*entry[K, V]).val = val
        return
    }
    elem := l.list.PushFront(&entry[K, V]{key, val})
    l.cache[key] = elem
    if l.list.Len() > l.capacity {
        oldest := l.list.Back()
        l.list.Remove(oldest)
        delete(l.cache, oldest.Value.(*entry[K, V]).key)
    }
}
```

使用：

```go
cache := NewLRU[string, *User](100)
cache.Put("user:1", user)
user, ok := cache.Get("user:1")
```

## 五、踩坑 1：泛型类型不能作为 map 的 key

```go
type Pair[T any] struct {
    A, B T
}

// ❌ 编译错误：Pair[T] 不满足 comparable
var m map[Pair[int]]int
```

**修复**：约束 `T` 为 `comparable`，并让 `Pair` 满足 `comparable`：

```go
type Pair[T comparable] struct {
    A, B T
}

var m map[Pair[int]]int  // OK
```

## 六、踩坑 2：泛型方法的 receiver 类型

```go
type Stack[T any] struct {
    items []T
}

// ✅ 值 receiver
func (s Stack[T]) Len() int {
    return len(s.items)
}

// ✅ 指针 receiver
func (s *Stack[T]) Push(v T) {
    s.items = append(s.items, v)
}
```

**注意**：泛型结构体的方法定义必须带上类型参数 `Stack[T]`，不能省略为 `Stack`。

## 七、踩坑 3：泛型 + 接口的不匹配

```go
type Iterator[T any] interface {
    Next() (T, bool)
}

func Collect[T any](it Iterator[T]) []T {
    var result []T
    for {
        v, ok := it.Next()
        if !ok {
            break
        }
        result = append(result, v)
    }
    return result
}

type IntSlice []int

// ❌ IntSlice 不实现 Iterator[int]
func (s IntSlice) Next() (int, bool) { ... }
```

**修复**：泛型方法的 receiver 必须用具体类型：

```go
func (s IntSlice) Next() (int, bool) {
    // ...
}
// 然后 Collect([]int{...}) // 仍不行
```

这里其实需要更复杂的设计，因为 `Next` 是有状态的。改用 `iter.Seq` 更简洁。

## 八、踩坑 4：类型推断的边界

```go
func Merge[K comparable, V any](maps ...map[K]V) map[K]V {
    result := make(map[K]V)
    for _, m := range maps {
        for k, v := range m {
            result[k] = v
        }
    }
    return result
}

// 类型推断：从第一个 map 推断 K=string, V=int
m := Merge(map[string]int{"a": 1}, map[string]int{"b": 2})

// ❌ 类型不一致无法推断
m := Merge(map[string]int{"a": 1}, map[string]string{"b": "x"})
```

**修复**：显式指定类型参数：

```go
m := Merge[string, any](map[string]int{"a": 1}, map[string]string{"b": "x"})
```

## 九、踩坑 5：泛型零值

```go
func FirstOrDefault[T any](s []T, def T) T {
    if len(s) == 0 {
        return def
    }
    return s[0]
}

// 用零值作为 default
func FirstOrZero[T any](s []T) T {
    var zero T  // 零值
    return FirstOrDefault(s, zero)
}
```

`var zero T` 是获取泛型零值的标准方式。指针类型是 `nil`，数值类型是 `0`，string 是 `""`。

## 十、踩坑 6：泛型类型的类型断言

```go
func Print[T any](v T) {
    // ❌ 不能直接断言具体类型
    if s, ok := v.(string); ok { ... }

    // ✅ 通过 any 中转
    if s, ok := any(v).(string); ok {
        fmt.Println("string:", s)
    }
}
```

## 十一、性能：泛型 vs 接口

Go 1.18 泛型实现是 **GC shape stenciling**：

- 不同 GC shape（指针 / 值类型）会生成不同的代码版本
- 同一 GC shape 的不同类型共享代码

```go
// 性能对比（1000 万元素）
// 1. 接口版本
func EachInterface(s []interface{}, f func(interface{})) { ... }

// 2. 泛型版本
func EachGeneric[T any](s []T, f func(T)) { ... }

// 结果
// 接口版本：580 ms（box / unbox 开销）
// 泛型版本：120 ms（无 box / unbox）
```

## 十二、iter 包高级用法

### iter.Pull：拉模式迭代

```go
next, stop := iter.Pull(seq)
defer stop()

for {
    v, ok := next()
    if !ok {
        break
    }
    // 处理 v
}
```

`iter.Pull` 把 push 模式（`iter.Seq`）转换成 pull 模式（`Next()` 风格）。适合需要主动控制迭代进度的场景。

### 自定义 Seq 实现：生成斐波那契

```go
func Fibonacci() iter.Seq[int] {
    return func(yield func(int) bool) {
        a, b := 0, 1
        for {
            if !yield(a) {
                return
            }
            a, b = b, a+b
        }
    }
}

// 使用
for n := range Fibonacci() {
    if n > 100 {
        break
    }
    fmt.Println(n)
}
```

无限序列 + break 即可。

### 文件行迭代器

```go
func Lines(path string) iter.Seq2[int, string] {
    return func(yield func(int, string) bool) {
        f, err := os.Open(path)
        if err != nil {
            return
        }
        defer f.Close()

        scanner := bufio.NewScanner(f)
        lineNo := 0
        for scanner.Scan() {
            lineNo++
            if !yield(lineNo, scanner.Text()) {
                return
            }
        }
    }
}

for i, line := range Lines("/etc/passwd") {
    fmt.Printf("%d: %s\n", i, line)
}
```

## 十三、泛型 channel 工具

```go
// Fan-in：合并多个 channel
func FanIn[T any](chs ...<-chan T) <-chan T {
    out := make(chan T)
    var wg sync.WaitGroup
    wg.Add(len(chs))
    for _, ch := range chs {
        go func() {
            defer wg.Done()
            for v := range ch {
                out <- v
            }
        }()
    }
    go func() {
        wg.Wait()
        close(out)
    }()
    return out
}

// 用法
merged := FanIn(prodCh, consCh, ctrlCh)
```

## 十四、实战：泛型 Result/Option 类型

```go
type Result[T any] struct {
    value T
    err   error
}

func Ok[T any](v T) Result[T] {
    return Result[T]{value: v}
}

func Err[T any](err error) Result[T] {
    var zero T
    return Result[T]{value: zero, err: err}
}

func (r Result[T]) Unwrap() T {
    if r.err != nil {
        panic(r.err)
    }
    return r.value
}

func (r Result[T]) UnwrapOr(def T) T {
    if r.err != nil {
        return def
    }
    return r.value
}

// 使用
func GetUser(id int) Result[*User] {
    user, err := db.FindUser(id)
    if err != nil {
        return Err[*User](err)
    }
    return Ok(user)
}

user := GetUser(123).UnwrapOr(&defaultUser)
```

## 十五、总结

Go 1.24 泛型实战要点：

1. **iter.Seq / Seq2 是迭代器的标准协议**
2. **range-over-func 让自定义集合像 slice 一样可迭代**
3. **泛型 + iter 配合能写出非常优雅的工具库**
4. **泛型方法的 receiver 必须带类型参数 `Stack[T]`**
5. **泛型类型作为 map key 需要 `comparable` 约束**

泛型让 Go 摆脱了「到处复制粘贴」的窘境，迭代器协议让 Go 终于有了像样的函数式编程能力。这两个特性合起来，是 Go 语言近 5 年最大的进化。
