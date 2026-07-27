import { defineConfig, globalIgnores } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';

// 兼容遗留 CommonJS 配置（eslint-config-next 仍是旧格式）
const compat = new FlatCompat({
  resolvePluginsRelativeTo: import.meta.dirname,
});

const eslintConfig = defineConfig([
  // compat.config 返回的是数组（多个 flat config 对象），必须展开
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
  }),
  {
    rules: {
      '@next/next/no-img-element': 'warn',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
