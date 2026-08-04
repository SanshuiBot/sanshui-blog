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
