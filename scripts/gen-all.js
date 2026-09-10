/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 并行执行构建前生成脚本（gen-posts-index / gen-feed / gen-og-image）。
 * -----------------------------
 * 替代 package.json 里 `&&` 串行链：三个脚本相互独立（各自只读 content/ 写 public/），
 * 并行可省 1-2s 构建时间；og 图还有签名跳过（内容未变时直接命中，几乎零耗时）。
 *
 * 用法：
 *   node scripts/gen-all.js --index --feed --og
 *   node scripts/gen-all.js --index --feed        # predev（dev 不需要 og 图）
 *
 * 退出码：任一子脚本非零退出则整体非零（任一失败即构建失败，不静默吞错）。
 * 子进程 stdio 继承：各脚本日志直接透传到终端（交错但可读）。
 */
const { spawn } = require('node:child_process');
const path = require('node:path');

/** 参数名 → 脚本文件名 */
const TARGETS = {
  index: 'gen-posts-index.js',
  feed: 'gen-feed.js',
  og: 'gen-og-image.js',
};

const requested = process.argv.slice(2).map((a) => a.replace(/^--/, ''));
const files = requested.map((name) => {
  if (!TARGETS[name]) {
    console.error(`✗ 未知生成脚本: ${name}（可选: ${Object.keys(TARGETS).join(' / ')}）`);
    process.exit(1);
  }
  return TARGETS[name];
});

if (files.length === 0) {
  console.error('✗ 未指定要运行的生成脚本（如 node scripts/gen-all.js --index --feed --og）');
  process.exit(1);
}

const procs = files.map((file) =>
  spawn(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' }),
);

Promise.all(
  procs.map(
    (p) =>
      new Promise((resolve) => {
        p.on('exit', (code) => resolve(code ?? 1));
      }),
  ),
).then((codes) => {
  if (codes.some((c) => c !== 0)) {
    console.error(`✗ 生成脚本存在失败（${files.join(' / ')}）`);
    process.exit(1);
  }
  console.log(`✓ 并行生成完成（${files.join(' / ')}）`);
});
