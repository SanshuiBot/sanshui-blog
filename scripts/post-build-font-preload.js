/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 构建后注入字体 preload —— Next 静态导出缺失字体预取的 userland 修复。
 * -----------------------------
 * 根因：output:'export' + webpack 下 `.next/server/next-font-manifest.json` 的
 * app 映射为空（框架 bug，见 vercel/next.js#57008），app-render 的
 * getPreloadableFonts() 返回 null → 全站不输出 `<link rel="preload" as="font">`。
 * 后果：首屏文字要等 CSS 解析后才开始下载字体（font-display:swap → FOUT）。
 *
 * 本脚本在构建后扫 out/**\/*.html：
 *  - 从页面引用的 CSS 里 @font-face 的 url(...) 中找出 loader 标记为「可预取」的
 *    latin 子集文件（文件名含 `.p.woff2` 后缀，见 find-font-files-in-css.js 的
 *    preloadFontFile 标记），
 *  - 在样式表 <link> 之后注入 `<link rel="preload" as="font" type="font/woff2"
 *    crossorigin="anonymous" href="...">`（as="font" 必须带 crossorigin，否则
 *    浏览器视其为不匹配 CORS 模式而忽略预取），
 *  - 幂等：已注入（含 `as="font"`）的页面跳过；URL 取自产物真实文件名，
 *    跨构建哈希变化自动跟随，双端（GH 带 /sanshui-blog 前缀 / CF 无前缀）通用。
 */
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.resolve(__dirname, '..', 'out');
/** next/font loader 对 preload 文件的后缀标记（-s.p.woff2） */
const PRELOADABLE_RE = /url\(([^)]*\.p\.woff2)\)/g;
const STYLESHEET_RE = /<link rel="stylesheet" href="([^"]+\.css)"[^>]*>/g;
const INJECTED_MARK = 'rel="preload" as="font"';

/** 把产物内 URL（可能带 /sanshui-blog 前缀）映射回磁盘路径 */
function toDisk(href) {
  let p = href.replace(/^\//, '');
  if (p.startsWith('sanshui-blog/')) p = p.slice('sanshui-blog/'.length);
  return path.join(OUT, p);
}

function walkHtml(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(p, acc);
    else if (entry.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

function main() {
  if (!fs.existsSync(path.join(OUT, 'index.html'))) {
    console.error('⚠ out/index.html 不存在，跳过字体 preload 注入');
    return;
  }

  // 1. 从各页面引用的 CSS 收集可预取字体 URL（保持 CSS 出现顺序、去重）
  const cssHrefs = new Set();
  for (const htmlFile of walkHtml(OUT)) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    for (const m of html.matchAll(STYLESHEET_RE)) cssHrefs.add(m[1]);
  }
  const fontHrefs = [];
  for (const cssHref of cssHrefs) {
    const cssPath = toDisk(cssHref);
    if (!fs.existsSync(cssPath)) continue;
    const css = fs.readFileSync(cssPath, 'utf8');
    for (const m of css.matchAll(PRELOADABLE_RE)) {
      const href = m[1].replace(/["']/g, '');
      if (!fontHrefs.includes(href)) fontHrefs.push(href);
    }
  }
  if (fontHrefs.length === 0) {
    console.warn('⚠ 未找到可预取字体（*.p.woff2），跳过注入');
    return;
  }
  // 产物完整性自检：注入的 URL 必须真实存在
  const missing = fontHrefs.filter((h) => !fs.existsSync(toDisk(h)));
  if (missing.length > 0) {
    console.error(`✗ 字体文件缺失：${missing.join(', ')}，中止注入`);
    process.exit(1);
  }

  const fontTags = fontHrefs
    .map(
      (h) =>
        `<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous" href="${h}"/>`,
    )
    .join('');

  // 2. 逐页注入：样式表 link 之后、仅首次出现；已注入则跳过（幂等）
  let injected = 0;
  for (const htmlFile of walkHtml(OUT)) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    if (html.includes(INJECTED_MARK)) continue;
    const next = html.replace(STYLESHEET_RE, (match) => `${match}${fontTags}`);
    if (next !== html) {
      fs.writeFileSync(htmlFile, next, 'utf8');
      injected++;
    }
  }

  console.log(`✓ 字体 preload 注入完成：${fontHrefs.join(', ')}（${injected} 个页面）`);
}

main();
