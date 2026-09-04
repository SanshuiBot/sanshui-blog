/**
 * 简历 markdown 的行切分纯函数。
 *
 * 独立成模块的原因：resume.ts 内含 node:fs，被客户端组件 import 会把 fs shim
 * 打进 bundle；本模块无任何 Node 依赖，客户端/服务端均可安全导入。
 */
export function splitResumeLines(markdown: string): string[] {
  // 末尾换行符会切出尾部空串，导致最后一行之后残留一个空行——先去掉末尾换行
  return markdown.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
}
