// 让 TypeScript 识别 CSS 导入（Next.js 内部已处理，仅供 IDE 类型检查用）
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
