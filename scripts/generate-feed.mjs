/**
 * Build-time script to generate feed.xml
 * Runs after `next build` to produce a static RSS feed file.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const baseUrl = 'https://sanshuibot.github.io/sanshui-blog';
const postsDir = path.join(rootDir, 'content/posts');
const outDir = path.join(rootDir, 'out');

function getAllPosts() {
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const slug = file.replace(/\.md$/, '');
    const title = content.match(/^title:\s*(.+)$/m)?.[1] || slug;
    const date = content.match(/^date:\s*(.+)$/m)?.[1] || '';
    const excerpt = content.match(/^excerpt:\s*(.+)$/m)?.[1] || '';
    const tagsMatch = content.match(/^tags:\s*\[(.+)\]$/m);
    const tags = tagsMatch ? tagsMatch[1].split(',').map((t) => t.trim().replace(/['"]/g, '')) : [];
    const dateStr = date ? new Date(date).toISOString().split('T')[0] : '';
    return { slug, title: title.replace(/['"]/g, ''), date: dateStr, excerpt: excerpt.replace(/['"]/g, ''), tags, content };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generate() {
  const posts = getAllPosts();

  const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>三水 | 个人博客</title>
    <link>${baseUrl}</link>
    <description>记录技术思考、生活感悟与创作灵感</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/posts/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      ${post.tags.map((tag) => `<category>${tag}</category>`).join('')}
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  const outPath = path.join(outDir, 'feed.xml');
  fs.writeFileSync(outPath, feedXml, 'utf-8');
  console.log(`Generated ${outPath}`);
}

generate();