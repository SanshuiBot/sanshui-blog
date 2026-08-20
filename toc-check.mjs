import fs from 'fs';
import Slugger from 'github-slugger';
const content = fs.readFileSync('content/posts/redis-分布式锁实战.md', 'utf-8');
const slugger = new Slugger();
const items = [];
let inFence = false;
for (const rawLine of content.split('\n')) {
  if (/^\s*(```|~~~)/.test(rawLine)) {
    inFence = !inFence;
    continue;
  }
  const m = /^(#{1,6})\s+(.+)$/.exec(rawLine);
  if (!m || inFence) continue;
  const level = m[1].length;
  const text = m[2].trim();
  const id = slugger.slug(text.replace(/<[^>]*>/g, ''));
  if (level === 2 || level === 3) items.push({ id, text, level });
}
console.log('count:', items.length);
console.log(items.slice(0, 4));
