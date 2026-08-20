import 'server-only';
import Slugger from 'github-slugger';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * 提取 ## / ### 标题生成目录。
 *
 * 与渲染侧 rehype-slug 共用同一个 github-slugger（v2 语义：保留中文/重音/假名、
 * 不去重连字符），保证目录锚点 id 与正文标题 id 严格一致：
 *  - 先剥 HTML 标签再生成 id（rehype-slug 操作的是文本节点，等价于此）
 *  - h1~h6 全部推进 slugger 状态（重复标题得到 -1/-2 后缀），只输出 h2/h3
 *  - 行扫描跳过代码围栏（``` / ~~~）内的假标题，避免死锚点
 *  - split(/\r?\n/)：兼容 CRLF 检出（Windows git autocrlf 会把 LF 转 CRLF；
 *    若按 '\n' 切，行末残留 \r，`.` 不匹配 \r，标题行全部匹配失败 → TOC 为空）
 */
export function extractHeadings(content: string): TocItem[] {
  const slugger = new Slugger();
  const items: TocItem[] = [];
  let inFence = false;

  for (const rawLine of content.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(rawLine)) {
      inFence = !inFence;
      continue;
    }
    const m = /^(#{1,6})\s+(.+)$/.exec(rawLine);
    if (!m || inFence) continue;
    const level = m[1]!.length;
    const text = m[2]!.trim();
    const id = slugger.slug(text.replace(/<[^>]*>/g, ''));
    if (level === 2 || level === 3) {
      items.push({ id, text, level });
    }
  }
  return items;
}
