/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 修复含点号标签（如 Next.js）的 RSC payload 404
 * -----------------------------------------------
 * 背景：Next Link 对含 `.` 的路径段（如 `/tags/Next.js/`）按「文件路径」处理，
 * 渲染时剥离尾斜杠 → 客户端软导航请求 RSC payload 走 `/tags/Next.js.txt`（404），
 * 而静态导出实际生成在 `/tags/Next.js/index.txt`（200）。本脚本在 build 后把
 * `out/tags/<含点目录>/index.txt` 复制为 `out/tags/<含点目录>.txt`，补上客户端
 * 实际请求的路径。其他标签（不含点号）链接正常带尾斜杠，无需处理。
 */
const fs = require('fs');
const path = require('path');

const tagsDir = path.join(__dirname, '..', 'out', 'tags');

if (!fs.existsSync(tagsDir)) {
  console.log('[gen-dotted-tag-payloads] out/tags 不存在，跳过');
  process.exit(0);
}

let copied = 0;
for (const name of fs.readdirSync(tagsDir)) {
  if (!name.includes('.')) continue; // 只处理含点号的目录名
  const dir = path.join(tagsDir, name);
  if (!fs.statSync(dir).isDirectory()) continue;
  const src = path.join(dir, 'index.txt');
  const dest = path.join(tagsDir, `${name}.txt`);
  if (!fs.existsSync(src)) continue;
  fs.copyFileSync(src, dest);
  console.log(`[gen-dotted-tag-payloads] ${name}/index.txt -> ${name}.txt`);
  copied++;
}
console.log(`[gen-dotted-tag-payloads] done, copied ${copied} file(s)`);
