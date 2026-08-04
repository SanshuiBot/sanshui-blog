---
title: React Native 新架构实战：Fabric 与 TurboModules
date: 2026-07-22
tags: [React Native, 前端, 技术]
excerpt: RN 新架构（Fabric + TurboModules + JSI）相比旧架构性能提升 3-5 倍。本文讲 JSI 直调 C++、Fabric 同步渲染、Codegen 类型生成，再到 5 个迁移踩坑点。
---

# React Native 新架构实战：Fabric 与 TurboModules

公司一个 React Native 项目，启动 1.8s、列表滚动掉帧严重。迁移到新架构（New Architecture）后，启动降到 600ms，滚动顺滑。这篇文章记录完整迁移过程。

## 一、新旧架构的根本差异

旧架构（Paper）：

1. JS 引擎通过「Bridge」与 Native 通信
2. Bridge 是异步的、消息队列式的
3. UI 操作：JS 调 `UIManager.measure()` → Bridge 序列化 → Native 反序列化 → 执行 → 结果序列化 → JS 反序列化
4. 大量跨边界通信时延迟累积

新架构：

1. JS 引擎通过 **JSI（JavaScript Interface）** 直接持有 C++ 对象引用
2. JSI 是同步的、零序列化的
3. **Fabric**：新渲染器，UI 操作同步执行
4. **TurboModules**：新原生模块系统，懒加载 + JSI 直调
5. **Codegen**：根据 TS / Flow 类型规范自动生成 C++ / Java / Obj-C 桥接代码

## 二、JSI 的本质：JS 持有 C++ 对象

旧 Bridge 通信示例：

```js
// JS
NativeModules.Database.query('SELECT * FROM users');
// → Bridge 异步序列化 → Native 解析执行 → Bridge 异步回传 → Promise resolve
```

JSI 通信：

```js
// JS
import { Database } from 'react-native-db'; // TurboModule
const db = new Database('app.db'); // 同步构造，直接持有 C++ 对象
const result = db.querySync('SELECT * FROM users'); // 同步调用 C++ 方法
```

**关键**：JS 直接调用 C++ 方法，没有序列化、没有异步等待。

## 三、启用新架构

```bash
# iOS
cd ios && RCT_NEW_ARCH_ENABLED=1 pod install

# Android
# gradle.properties 加
# newArchEnabled=true
# hermesEnabled=true
```

然后 `npx react-native build-android --mode release` 重新构建。

**踩坑 1：Hermes 是硬性要求**

新架构依赖 JSI，JSI 只在 Hermes 引擎上完整实现。如果项目用 JSC 或 V8，先迁移到 Hermes：

```ts
// android/app/build.gradle
project.ext.react = [
  enableHermes: true
]
```

**踩坑 2：第三方库必须支持新架构**

旧库会通过「Bridge Compatibility Layer」继续工作，但性能不如原生新架构库。检查每个库是否标记了 `codegenConfig` 或新架构兼容性。

## 四、TurboModules 实战：从 TS 规范到 C++ 实现

### 第一步：定义 TS 规范

```ts
// src/NativeCalculator.ts
import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  add(a: number, b: number): Promise<number>;
  addSync(a: number, b: number): number; // 同步方法
}

export default TurboModuleRegistry.getEnforcing<Spec>('Calculator');
```

### 第二步：让库暴露这个规范

```js
// package.json
{
  "name": "my-calculator",
  "codegenConfig": {
    "name": "RNCalculatorSpec",
    "type": "modules",
    "jsSrcsDir": "src"
  }
}
```

### 第三步：运行 Codegen

```bash
node node_modules/react-native/scripts/generate-codegen-artifacts.js \
  --path . \
  --outputPath ./generated
```

Codegen 会生成：

- C++ 接口（`RNCalculatorSpec.h`）
- Obj-C / Java 接口
- TS 类型（供 JS 使用）

### 第四步：实现 Native 代码

iOS（Obj-C++）：

```objc
// RCTCalculator.h
#import "RNCalculatorSpec.h"

@interface RCTCalculator : NSObject <NativeCalculatorSpec>
@end

// RCTCalculator.mm
#import "RCTCalculator.h"

@implementation RCTCalculator

RCT_EXPORT_MODULE()

- (NSNumber *)add:(double)a b:(double)b {
  return @(a + b);
}

- (double)addSync:(double)a b:(double)b {
  return a + b;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeCalculatorSpecJSI>(params);
}

@end
```

JS 端直接调用：

```ts
import NativeCalculator from './src/NativeCalculator';

const sum = await NativeCalculator.add(1, 2); // 异步 Promise
const sync = NativeCalculator.addSync(1, 2); // 同步，直接拿值
```

**对比旧 Bridge**：

- 旧：`NativeModules.Calculator.add(...)` 返回 Promise，至少 1 个 JS tick 延迟
- 新：`addSync(...)` 同步返回，零延迟

## 五、Fabric 实战：自定义同步渲染组件

### TS 规范

```ts
// src/RNCustomViewNativeComponent.ts
import type { ViewProps } from 'react-native/Libraries/Components/View/ViewPropTypes';
import type { HostComponent } from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export interface NativeProps extends ViewProps {
  color?: string;
  radius?: number;
}

export default codegenNativeComponent<NativeProps>('RNCustomView') as HostComponent<NativeProps>;
```

### React 组件

```tsx
import NativeCustomView from './src/RNCustomViewNativeComponent';

function CustomView({ color, radius }: { color: string; radius: number }) {
  return <NativeCustomView color={color} radius={radius} style={{ width: 100, height: 100 }} />;
}
```

### iOS 实现

```objc
// RCTCustomView.mm
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

@interface RCTCustomView : RCTViewComponentView
@property (nonatomic, strong) UIColor *color;
@property (nonatomic, assign) CGFloat radius;
@end

@implementation RCTCustomView
- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    self.layer.masksToBounds = YES;
  }
  return self;
}
- (void)setColor:(UIColor *)color {
  _color = color;
  self.backgroundColor = color;
}
- (void)setRadius:(CGFloat)radius {
  _radius = radius;
  self.layer.cornerRadius = radius;
}
@end

// Class 对外注册
Class<RCTComponentViewProtocol> RNCustomViewCls(void) {
  return RCTCustomView.class;
}
```

**关键**：Fabric 组件继承 `RCTViewComponentView`，状态更新是同步的。旧架构 `<View>` 是 async 渲染，新架构是 sync。

## 六、踩坑 3：useFrameCallback 替代 Animated API

新架构下，传统 `Animated` API 的 JS driver 性能依然不如新 `useFrameCallback`。

```tsx
// 新架构推荐写法
import { useFrameCallback } from 'react-native-reanimated';

function MyComponent() {
  const sv = useSharedValue(0);

  useFrameCallback((info) => {
    sv.value = info.timeSinceFirstFrame / 1000;
  });

  return <Animated.View style={{ transform: [{ rotate: `${sv.value * 360}deg` }] }} />;
}
```

`useFrameCallback` 在 UI 线程同步执行，完全绕过 JS 线程。

## 七、踩坑 4：Gradle 缓存爆炸

启用新架构后，Android 构建时间从 30s 飙升到 120s。原因是 Codegen 每次都重新生成大量 C++ 代码。

**解决方案**：

```gradle
// android/gradle.properties
android.cacheDir=../../.gradle-cache
newArchEnabled=true

// 启用 build cache
org.gradle.caching=true
org.gradle.configuration-cache=true
```

## 八、踩坑 5：iOS pod install 时 Codegen 失败

```bash
[Codegen] ERROR: Cannot find module 'react-native-codegen'
```

原因：依赖路径解析问题。**修复**：

```ruby
# ios/Podfile
# 顶部加
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

# 然后
install! 'cocoapods', :disable_input_output_paths => true
```

并确保 `pod install` 时设置：

```bash
RCT_NEW_ARCH_ENABLED=1 pod install
```

## 九、性能对比：旧 vs 新

| 指标                | 旧架构 | 新架构 | 提升 |
| ------------------- | ------ | ------ | ---- |
| 冷启动时间          | 1.8s   | 600ms  | 3x   |
| 列表滚动 FPS        | 35     | 60     | 1.7x |
| Native 方法调用延迟 | 5-10ms | < 1ms  | 10x  |
| JS Bundle 大小      | 4.2MB  | 3.8MB  | 10%  |

## 十、迁移路径：渐进式而非大爆炸

不要试图一次性迁移所有代码。推荐路径：

### 阶段 1：启用新架构 + 兼容模式

```js
// ios/Podfile 加：
:fabric_enabled => true,
:bridgeless_enabled => true
```

Bridge Compatibility Layer 会让旧代码继续工作。先确保 app 能编译运行。

### 阶段 2：替换第三方库为新架构版本

```diff
- "react-native-reanimated": "2.3.0"
+ "react-native-reanimated": "3.0.0"  // 新架构版本
```

主要替换：

- `react-native-reanimated` → v3+
- `react-native-gesture-handler` → v2.10+
- `react-native-screens` → v3.20+

### 阶段 3：自研原生模块迁移到 TurboModule

逐个迁移，每个模块迁移完后跑性能测试。

### 阶段 4：自研 UI 组件迁移到 Fabric

最复杂，最后做。建议参考 `react-native-linear-gradient` 等开源库的新架构迁移 PR。

## 十一、调试新架构

### 1. 确认新架构已启用

```bash
npx react-native config | grep newArch
```

### 2. 查看 JSI 调用统计

```ts
import { performance } from 'perf_hooks';

const t0 = performance.now();
NativeModule.method();
console.log(`Call took ${performance.now() - t0}ms`);
```

如果耗时 < 1ms，说明走的是 JSI；如果 > 5ms，可能回退到 Bridge Compatibility。

### 3. Fabric 渲染调试

iOS：

```bash
RCT_DEBUG_FABRIC=1 npx react-native run-ios
```

会打印每次 Fabric 提交（commit）的耗时。

## 十二、总结

新架构不是「升级」，是「重写」。三点最关键：

1. **JSI 让 JS 直调 C++**：同步、零序列化
2. **Codegen 替代手写桥接**：TS 规范 → C++ / Java / Obj-C 接口
3. **Fabric 同步渲染**：UI 操作不再走异步 Bridge

迁移是漫长过程，但每一步都能立刻看到性能提升。RN 在新架构下终于和原生实现了性能对齐。
