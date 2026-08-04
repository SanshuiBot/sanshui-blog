import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import reactHooks from 'eslint-plugin-react-hooks';

// eslint-config-next 16 起原生导出 flat config（不再需要 FlatCompat 兼容 eslintrc 格式）
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // flat config 的规则必须与插件在同一个配置对象内注册，这里显式注册以覆盖其规则
    plugins: { 'react-hooks': reactHooks },
    rules: {
      '@next/next/no-img-element': 'warn',
      // react-hooks v7 新编译器规则对既有正确模式过于严格，降为 warn 保留可见性：
      // - set-state-in-effect：next-themes hydration 守卫 / localStorage 初始化 /
      //   路由变化重置 / matchMedia 同步，均为正确的遗留写法（行为由 75 个单测 +
      //   完整构建保障，重构有引入 hydration 错配风险）
      // - refs：Tooltip 渲染期读取测量值（bubble 尺寸），遗留测量模式
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
