import fs from 'node:fs';
import path from 'node:path';

const RESUME_PATH = path.join(process.cwd(), 'content', 'resume.md');

/**
 * 构建时读取本地简历 markdown。
 *
 * 简历源文件位于 `content/resume.md`，用户可在本地直接编辑。
 * 组件拿到原始 markdown 后，再按"行"做流式打印。
 */
export function getResumeMarkdown(): string {
  try {
    return fs.readFileSync(RESUME_PATH, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * 将 markdown 切成"逻辑行"用于流式输出。
 *
 * - 普通文本按行切分
 * - 列表项（- xxx）保留前导 `- `，作为可被渲染解析的标记
 * - 保留空行，作为打印节奏的间隔
 */
export function splitResumeLines(markdown: string): string[] {
  return markdown.replace(/\r\n/g, '\n').split('\n');
}
