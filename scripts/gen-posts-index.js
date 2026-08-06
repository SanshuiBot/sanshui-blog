/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 生成 public/posts-index.json —— SearchModal 运行时 fetch 的轻量索引。
 * 只保留 slug/title/date/excerpt/tags，剔除 content（~72KB → ~10KB），
 * 让全量文章数据不再被序列化进 RSC payload。
 *
 * 解析契约来自 src/lib/parse-post.mjs（与 posts.ts 共享同一实现，避免漂移）；
 * 脚本是 CJS，通过 await import 动态加载 ESM 模块。
 *
 * 触发点：
 *   - predev  (npm run dev 前)
 *   - prebuild (npm run build 前)
 */
const fs = require('node:fs');
const path = require('node:path');

const postsDir = path.resolve(__dirname, '..', 'content', 'posts');
const outPath = path.resolve(__dirname, '..', 'public', 'posts-index.json');

async function build() {
  if (!fs.existsSync(postsDir)) {
    console.warn('! content/posts 不存在，跳过索引生成');
    return;
  }
  const { parsePostFile, isPostFile, sortPostsByDateDesc } =
    await import('../src/lib/parse-post.mjs');
  const files = fs.readdirSync(postsDir).filter(isPostFile);

  const posts = files
    .map((fn) => {
      const p = parsePostFile(fn, fs.readFileSync(path.join(postsDir, fn), 'utf-8'));
      // 索引只保留轻量字段，剔除 content。
      // 字段集与 src/lib/post-index.ts 的 PostIndexEntry 字面一致（ADR-0004 隐式契约）——
      // 未来字段变更改两处（此处 + post-index.ts）。脚本是 CJS 不 await import TS，
      // 靠注释 + TS 类型双保险提醒。
      return { slug: p.slug, title: p.title, date: p.date, excerpt: p.excerpt, tags: p.tags };
    })
    .sort(sortPostsByDateDesc);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(posts));
  console.log(`✓ 已生成 public/posts-index.json (${posts.length} 篇)`);
}

build().catch((err) => {
  console.error('生成 posts-index.json 失败:', err);
  process.exit(1);
});
