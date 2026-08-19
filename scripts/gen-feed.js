/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 生成 public/feed.xml —— RSS 2.0 订阅源。
 * -----------------------------
 * 解析契约复用 src/lib/parse-post.mjs（与 posts.ts / gen-posts-index.js 同一实现）。
 * 站点常量与 src/lib/site.ts 字面一致（脚本是 CJS 无法 import TS，靠注释双保险）——
 * 未来站点信息变更需同步此处 + site.ts。
 *
 * 触发点：predev / prebuild（生成后 Footer 的 RSS 图标链接到 /feed.xml）。
 */
const fs = require('node:fs');
const path = require('node:path');

const postsDir = path.resolve(__dirname, '..', 'content', 'posts');
const outPath = path.resolve(__dirname, '..', 'public', 'feed.xml');

// 与 src/lib/site.ts 保持一致的站点常量（BASE_PATH = /sanshui-blog）
const SITE = {
  title: '三水 | 个人博客',
  name: '三水',
  description: '记录技术思考、生活感悟与创作灵感',
  baseUrl: 'https://sanshuibot.github.io/sanshui-blog',
  email: 'localhost6@foxmail.com',
};

/** XML 转义（RSS 内容与属性都需要） */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RFC 822 日期（RSS pubDate 要求）：new Date 的 toUTCString 就是该格式 */
function rfc822(dateStr) {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

/** 提取正文首个 h1/h2/代码块外的纯文本前 160 字做 item description（无 frontmatter 的 excerpt 兜底） */
function plainExcerpt(content, fallback) {
  if (fallback) return fallback;
  return content
    .slice(0, 160)
    .replace(/[#*`\[\]]/g, '')
    .trim();
}

async function build() {
  if (!fs.existsSync(postsDir)) {
    console.warn('! content/posts 不存在，跳过 feed 生成');
    return;
  }
  const { parsePostFile, isPostFile, sortPostsByDateDesc } =
    await import('../src/lib/parse-post.mjs');
  const files = fs.readdirSync(postsDir).filter(isPostFile);

  const posts = files
    .map((fn) => parsePostFile(fn, fs.readFileSync(path.join(postsDir, fn), 'utf-8')))
    .sort(sortPostsByDateDesc);

  const items = posts
    .map((p) => {
      const link = `${SITE.baseUrl}/posts/${encodeURIComponent(p.slug)}/`;
      const description = plainExcerpt(p.content, p.excerpt);
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${esc(description)}</description>
      <content:encoded><![CDATA[${p.content}]]></content:encoded>
      ${p.tags.map((t) => `<category>${esc(t)}</category>`).join('\n      ')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(SITE.title)}</title>
    <link>${SITE.baseUrl}</link>
    <description>${esc(SITE.description)}</description>
    <language>zh-cn</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE.baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>
`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, xml, 'utf-8');
  console.log(`✓ 已生成 public/feed.xml (${posts.length} 篇)`);
}

build().catch((err) => {
  console.error('生成 feed.xml 失败:', err);
  process.exit(1);
});
