// 让 TypeScript 识别 CSS 导入（Next.js 内部已处理，仅供 IDE 类型检查用）
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// highlightjs-solidity 没有官方类型，这里声明其结构
declare module 'highlightjs-solidity' {
  import type { LanguageFn } from 'highlight.js';
  const solidity: LanguageFn;
  const yul: LanguageFn;
  const languages = { solidity, yul };
  export { solidity, yul };
  export default languages;
}
