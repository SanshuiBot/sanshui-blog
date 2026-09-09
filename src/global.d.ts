// 让 TypeScript 识别 CSS 导入（Next.js 内部已处理，仅供 IDE 类型检查用）
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// highlight.js 单语言模块（lib/languages/*）不附带类型声明，统一声明为 LanguageFn
declare module 'highlight.js/lib/languages/*' {
  import type { LanguageFn } from 'highlight.js';
  const fn: LanguageFn;
  export default fn;
}
