/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 构建产物清理（post-build）
 * -----------------------------------------------
 * 删除 out/ 中三类确认无引用的产物，缩小部署体积：
 *
 * 1. 冗余 chunk：`framework-*.js` / `main-*.js`（Pages Router 遗留）。
 *    Next 16 App Router 已把 React 打进 `4bd1b696-*`，framework/main
 *    不在任何 HTML 的 `<script src>`、build-manifest rootMainFiles、
 *    webpack runtime 的 chunk URL 映射表中，浏览器永远不会请求。
 * 2. 未引用字体：Next 字体优化生成的 `*.p.woff2` preload 子集，
 *    但 HTML 无 `<link rel="preload" as="font">`、CSS @font-face 也不引用。
 * 3. `__next.*` 调试副本：每个路由目录下与 index.txt 同内容的
 *    `__next._full.txt` / `__next._tree.txt` / `__next.<route>/`。
 *    客户端在静态导出下只请求 `<route>/index.txt`（软导航 RSC payload），
 *    `__next.*` 路径在客户端 JS 中零请求（fetch-server-response.js 拼接逻辑）。
 *
 * 安全校验：删除前收集所有 .html/.css 中的资源引用 + webpack runtime
 * 的 chunk 映射，**被引用到的一律不删**——即使未来 Next 行为变化也不会误删。
 */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');

/** 递归收集目录下所有 .html 里的 src/href 资源 basename（含 basePath 前缀截断） */
function collectHtmlRefs(dir, set) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtmlRefs(p, set);
    else if (entry.name.endsWith('.html')) {
      const html = fs.readFileSync(p, 'utf-8');
      for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) set.add(path.basename(m[1]));
    }
  }
}

/** 收集 .css 里的 url(...) 资源 basename */
function collectCssRefs(dir, set) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collectCssRefs(p, set);
    else if (entry.name.endsWith('.css')) {
      const css = fs.readFileSync(p, 'utf-8');
      for (const m of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) set.add(path.basename(m[1]));
    }
  }
}

/** 收集 webpack runtime 里 chunk URL 映射涉及的 chunk 文件名（懒加载 chunk 也被保护） */
function collectRuntimeChunks(dir, set) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collectRuntimeChunks(p, set);
    else if (/^webpack-[a-z0-9]+\.js$/.test(entry.name)) {
      const js = fs.readFileSync(p, 'utf-8');
      for (const m of js.matchAll(/static\/chunks\/([a-zA-Z0-9./-]+\.js)/g))
        set.add(path.basename(m[1]));
    }
  }
}

/** 收集整个 out/ 的所有文件（相对 out 的路径列表） */
function collectAllFiles(dir, acc = [], prefix = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collectAllFiles(p, acc, rel);
    else acc.push({ rel, p });
  }
  return acc;
}

if (!fs.existsSync(outDir)) {
  console.log('[post-build-cleanup] out/ 不存在，跳过');
  process.exit(0);
}

// —— 安全校验集合：被这些集合引用到的文件绝不删除 ——
const referenced = new Set();
collectHtmlRefs(outDir, referenced);
collectCssRefs(outDir, referenced);
collectRuntimeChunks(path.join(outDir, '_next', 'static', 'chunks'), referenced);

const allFiles = collectAllFiles(outDir);
const deleted = [];
const skipped = [];

const tryDelete = (rel, reason) => {
  const base = path.basename(rel);
  if (referenced.has(base)) {
    skipped.push(`${rel}（被引用，拒删）`);
    return;
  }
  const p = path.join(outDir, rel);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { force: true });
    deleted.push(`${rel}（${reason}）`);
  }
};

// 1. 冗余 chunk：framework-*.js / main-*.js（main-app-* 是 App Router 入口，不能动）
for (const { rel } of allFiles) {
  const base = path.basename(rel);
  if (/^framework-[a-z0-9]+\.js$/.test(base)) tryDelete(rel, '冗余 chunk');
  if (/^main-[a-z0-9]+\.js$/.test(base)) tryDelete(rel, '冗余 chunk');
}

// 2. 未引用字体：磁盘上有但无任何 HTML/CSS 引用的 woff2
for (const { rel } of allFiles) {
  if (rel.endsWith('.woff2')) tryDelete(rel, '未引用字体');
}

// 3. __next.* 调试副本：文件与目录（顶层 + 各路由目录）
for (const { rel } of allFiles) {
  if (rel.includes('/__next.') || rel.startsWith('__next.')) tryDelete(rel, '__next 调试副本');
}
// 目录形态：__next.<route>/ 目录（如 out/archive/__next.archive/）
for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
  if (entry.name.startsWith('__next.') && entry.isDirectory()) {
    fs.rmSync(path.join(outDir, entry.name), { recursive: true, force: true });
    deleted.push(`${entry.name}/（__next 调试副本目录）`);
  }
}
const walkDirs = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('__next.')) {
        fs.rmSync(p, { recursive: true, force: true });
        deleted.push(`${path.relative(outDir, p)}/（__next 调试副本目录）`);
      } else walkDirs(p);
    }
  }
};
walkDirs(outDir);

console.log(`[post-build-cleanup] 删除 ${deleted.length} 个，跳过 ${skipped.length} 个`);
for (const d of deleted) console.log(`  ✂ ${d}`);
for (const s of skipped) console.log(`  ⚠ ${s}`);
