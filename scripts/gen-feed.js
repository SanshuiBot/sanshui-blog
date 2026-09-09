/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 生成 public/feed.xml —— RSS 2.0 订阅源。
 * -----------------------------
 * 解析契约复用 src/lib/parse-post.mjs（与 posts.ts / gen-posts-index.js 同一实现）。
 * 站点常量收口 src/lib/site-config.mjs（唯一数据源，site.ts 同源）——
 * 改站点信息只改 site-config.mjs，无需同步本文件。
 *
 * 体积控制：`<content:encoded>` 全文只进最新 10 篇（FULL_CONTENT_LIMIT），
 * 旧文章仅输出摘要——避免 feed 随文章数无限膨胀（23 篇全量全文约 332KB）。
 *
 * 触发点：predev / prebuild（生成后 Footer 的 RSS 图标链接到 /feed.xml）。
 */
const fs = require('node:fs');
const path = require('node:path');

const postsDir = path.resolve(__dirname, '..', 'content', 'posts');
const outPath = path.resolve(__dirname, '..', 'public', 'feed.xml');

/** XML 转义（RSS 内容与属性都需要） */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RFC 822 日期（RSS pubDate 要求）：new Date 的 toUTCString 就是该格式。
    非法/缺失日期回退到固定 epoch——**不能**用 new Date().toUTCString()：
    每次 build 时间戳不同，feed.xml 永远有 git 噪音。 */
const EPOCH_RFC822 = 'Thu, 01 Jan 1970 00:00:00 GMT';

function rfc822(dateStr) {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? EPOCH_RFC822 : d.toUTCString();
}

// 全文只进最新 N 篇（posts 已按日期降序，前 N 篇即最新）；旧文章只给摘要。
const FULL_CONTENT_LIMIT = 10;

/** 第 i 篇（按日期降序）是否输出全文：仅最新 FULL_CONTENT_LIMIT 篇 */
function hasFullContent(index) {
  return index < FULL_CONTENT_LIMIT;
}

/** 提取正文首个 h1/h2/代码块外的纯文本前 160 字做 item description（无 frontmatter 的 excerpt 兜底） */
function plainExcerpt(content, fallback) {
  if (fallback) return fallback;
  return content
    .slice(0, 160)
    .replace(/[#*`\[\]]/g, '')
    .trim();
}

/** CDATA 安全包裹：正文里出现 `]]>` 会提前终止 CDATA 段（如文章内嵌 XML 示例），
    需拆成两个 CDATA 段拼接，避免产出畸形 XML。 */
function cdata(s) {
  return `<![CDATA[${String(s).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

async function build() {
  if (!fs.existsSync(postsDir)) {
    console.warn('! content/posts 不存在，跳过 feed 生成');
    return;
  }
  const { parsePostFile, isPostFile, sortPostsByDateDesc } =
    await import('../src/lib/parse-post.mjs');
  // 站点常量唯一数据源（与 site.ts 共用）；CJS 不能同步 require ESM，在 async 内动态 import
  const { SITE_TITLE, SITE_DESCRIPTION, SITE_ORIGIN, SITE_BASE_PATH, SITE_EMAIL } =
    await import('../src/lib/site-config.mjs');
  const SITE = {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    baseUrl: `${SITE_ORIGIN}${SITE_BASE_PATH}`,
    email: SITE_EMAIL,
  };
  const files = fs.readdirSync(postsDir).filter(isPostFile);

  const posts = files
    .map((fn) => parsePostFile(fn, fs.readFileSync(path.join(postsDir, fn), 'utf-8')))
    .sort(sortPostsByDateDesc);

  const items = posts
    .map((p, i) => {
      const link = `${SITE.baseUrl}/posts/${encodeURIComponent(p.slug)}/`;
      const description = plainExcerpt(p.content, p.excerpt);
      // 全文只进最新 FULL_CONTENT_LIMIT 篇；旧文章仅摘要，控制 feed 体积
      const fullContent = hasFullContent(i) ? cdata(p.content) : '';
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${esc(description)}</description>
      ${fullContent ? `<content:encoded>${fullContent}</content:encoded>` : ''}
      ${p.tags.map((t) => `<category>${esc(t)}</category>`).join('\n      ')}
    </item>`;
    })
    .join('\n');

  // lastBuildDate 用最新文章日期（确定性）——不能用 new Date()（每次 build 时间戳不同产生 git 噪音）。
  // posts 已按日期降序；取全部文章中的最大有效日期，全部缺失则回退固定 epoch
  const latestDate = posts.reduce((acc, p) => (p.date > acc ? p.date : acc), '');
  const lastBuildDate = latestDate ? rfc822(latestDate) : EPOCH_RFC822;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(SITE.title)}</title>
    <link>${SITE.baseUrl}</link>
    <description>${esc(SITE.description)}</description>
    <language>zh-cn</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE.baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>
`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, xml, 'utf-8');
  console.log(`✓ 已生成 public/feed.xml (${posts.length} 篇)`);
}

// require.main 守卫：被单测 import 时不触发构建副作用（predev/prebuild 直跑才生成）。
// 纯函数导出供 tests/gen-feed.test.ts 锁定 CDATA 转义与全文截断契约。
if (require.main === module) {
  build().catch((err) => {
    console.error('生成 feed.xml 失败:', err);
    process.exit(1);
  });
}

module.exports = { esc, rfc822, plainExcerpt, cdata, hasFullContent, FULL_CONTENT_LIMIT };
