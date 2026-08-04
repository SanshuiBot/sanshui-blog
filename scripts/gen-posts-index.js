/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 生成 public/posts-index.json —— SearchModal 运行时 fetch 的轻量索引。
 * 只保留 slug/title/date/excerpt/tags，剔除 content（~72KB → ~10KB），
 * 让全量文章数据不再被序列化进 RSC payload。
 *
 * 触发点：
 *   - predev  (npm run dev 前)
 *   - prebuild (npm run build 前)
 */
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const postsDir = path.resolve(__dirname, '..', 'content', 'posts');
const outPath = path.resolve(__dirname, '..', 'public', 'posts-index.json');

function build() {
  if (!fs.existsSync(postsDir)) {
    console.warn('! content/posts 不存在，跳过索引生成');
    return;
  }
  const files = fs.readdirSync(postsDir).filter((fn) => fn.endsWith('.md') || fn.endsWith('.mdx'));

  const posts = files
    .map((fn) => {
      const { data, content } = matter(fs.readFileSync(path.join(postsDir, fn), 'utf-8'));
      const slug = fn.replace(/\.(mdx?)$/, '');
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
        excerpt:
          data.excerpt ??
          content
            .slice(0, 160)
            .replace(/[#*`\[\]]/g, '')
            .trim(),
        tags: data.tags ?? [],
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(posts));
  console.log(`✓ 已生成 public/posts-index.json (${posts.length} 篇)`);
}

build();
