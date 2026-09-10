/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 生成 public/og.png —— 社交分享卡片（1200×630）。
 * -----------------------------
 * 使用 sharp 渲染 SVG，支持中文文字（CI Linux runner 自带 Noto CJK 字体）。
 *
 * 设计（与站点 Aurora 玻璃态视觉统一）：
 *  - 背景：深色 Aurora 渐变（pink→violet→blue→teal→gold），同站点 body::after glow
 *  - 网格：56px 对角流光网格，径向淡出（同 hero-aurora-grid）
 *  - 顶部 accent 线：粉色→紫→蓝三色调渐变（同 PostCard top accent line）
 *  - 主标题「三水」：白色大字号 + 微光晕（模拟 .text-aurora 但用纯色确保可读）
 *  - 副标题：记录技术思考、生活感悟与创作灵感
 *  - 底部 URL 标签：半透明 glass 胶囊 + 浅灰文字
 *
 * 触发点：npm run prebuild（构建前自动重建，确定性输出，无 git 噪音）。
 *
 * 增量渲染：对 SVG 源做 SHA-256 签名存根（.og-image-signature，随仓库提交——
 * CI 全新 clone 也能命中跳过）；签名未变且 og.png 存在时跳过 sharp 渲染。
 * 站点文案/配色改动会改变 SVG 内容 → 签名失配 → 自动重画，无漏更风险。
 */
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const W = 1200;
const H = 630;

// 与 src/lib/accents.ts ACCENT_PRESETS 同源色
const COLORS = {
  ink: '#05050a',
  pink: '#ff6ec7',
  violet: '#a855f7',
  blue: '#38bdf8',
  teal: '#2dd4bf',
  gold: '#fbbf24',
  rose: '#fb7185',
  white: '#ffffff',
  fgMuted: '#8b8b9e',
  glassBorder: 'rgba(255,255,255,0.10)',
};

/**
 * 沿调色板插值的渐变色标（用于对角背景）
 */
const GRADIENT_STOPS = [
  { offset: 0, color: COLORS.pink },
  { offset: 0.25, color: COLORS.violet },
  { offset: 0.5, color: COLORS.blue },
  { offset: 0.7, color: COLORS.teal },
  { offset: 1, color: COLORS.gold },
];

/**
 * 绘制 Aurora 对角渐变底色 + 网格 + 暗角（SVG 方式）
 * @param {string} siteUrl 线上站点 URL（origin + basePath），渲染进底部胶囊
 */
function buildSvgContent(siteUrl) {
  // 对角渐变：左下(0,1) → 右上(1,0)，用 linearGradient x1 y1 x2 y2 控制
  const gradientStops = GRADIENT_STOPS.map(
    (s) => `<stop offset="${s.offset}" stop-color="${s.color}" stop-opacity="0.35"/>`,
  ).join('\n');

  // 网格：56px 间距的对角线 pattern
  const gridPattern = `<pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
    <path d="M 56 0 L 0 0 0 56" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
  </pattern>`;

  // 中心辉光：椭圆径向渐变（偏上方）
  const glowDef = `<radialGradient id="glow" cx="50%" cy="40%" r="55%">
    <stop offset="0%" stop-color="white" stop-opacity="0.18"/>
    <stop offset="60%" stop-color="white" stop-opacity="0.04"/>
    <stop offset="100%" stop-color="white" stop-opacity="0"/>
  </radialGradient>`;

  // 顶部 accent 线渐变（粉色→紫→蓝）
  const accentLineGrad = `<linearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="${COLORS.pink}"/>
    <stop offset="50%" stop-color="${COLORS.violet}"/>
    <stop offset="100%" stop-color="${COLORS.blue}"/>
  </linearGradient>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <!-- Aurora 对角渐变底色 -->
    <linearGradient id="bgGrad" x1="0" y1="1" x2="1" y2="0">
      ${gradientStops}
    </linearGradient>
    <!-- 暗角 -->
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="40%" stop-color="${COLORS.ink}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${COLORS.ink}" stop-opacity="0.7"/>
    </radialGradient>
    ${glowDef}
    ${gridPattern}
    ${accentLineGrad}
    <!-- 文字光晕 -->
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- 底色 -->
  <rect width="${W}" height="${H}" fill="${COLORS.ink}"/>
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>

  <!-- 网格层 -->
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <!-- 网格径向淡出 mask -->
  <rect width="${W}" height="${H}" fill="url(#grid)" mask="url(#gridMask)"/>
  <mask id="gridMask">
    <ellipse cx="${W / 2}" cy="${H * 0.42}" rx="${W * 0.55}" ry="${H * 0.5}" fill="white"/>
  </mask>

  <!-- 中心辉光 -->
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- 暗角 -->
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>

  <!-- ═══ 内容层 ═══ -->

  <!-- 顶部 accent 线（从左侧 10% 开始，延伸至 60% 处渐隐） -->
  <line x1="${W * 0.1}" y1="80" x2="${W * 0.6}" y2="80"
        stroke="url(#accentLine)" stroke-width="3" stroke-linecap="round"
        opacity="0.8"/>

  <!-- 主标题「三水」：带光晕，白色大字 -->
  <text x="${W / 2}" y="${H * 0.44}" text-anchor="middle"
        fill="${COLORS.white}" font-family="'Inter','PingFang SC','Noto Sans SC',sans-serif"
        font-size="120" font-weight="800" letter-spacing="-2"
        filter="url(#glowFilter)">三水</text>

  <!-- 副标题 / 站点描述 -->
  <text x="${W / 2}" y="${H * 0.6}" text-anchor="middle"
        fill="${COLORS.fgMuted}" font-family="'Inter','PingFang SC','Noto Sans SC',sans-serif"
        font-size="26" font-weight="400" letter-spacing="1">
    记录技术思考、生活感悟与创作灵感
  </text>

  <!-- 底部 glass 胶囊：URL -->
  <g transform="translate(${(W - 400) / 2}, ${H - 80})">
    <rect width="400" height="44" rx="22"
          fill="rgba(255,255,255,0.06)" stroke="${COLORS.glassBorder}" stroke-width="1"/>
    <text x="200" y="28" text-anchor="middle"
          fill="rgba(255,255,255,0.55)" font-family="'JetBrains Mono','Fira Code','Consolas',monospace"
          font-size="15" font-weight="400" letter-spacing="0.5">
      ${siteUrl}
    </text>
  </g>
</svg>`;
}

async function generateOG() {
  // 线上站点 URL 读 site-config.mjs（双端部署：GitHub 默认 /sanshui-blog，
  // CF 端由 SITE_ORIGIN / SITE_BASE_PATH 环境变量覆盖，og 图上 URL 与站点一致）
  const { SITE_ORIGIN, SITE_BASE_PATH } = await import('../src/lib/site-config.mjs');
  const siteUrl = `${SITE_ORIGIN}${SITE_BASE_PATH}/`;
  const svg = buildSvgContent(siteUrl);
  const outPath = path.resolve(__dirname, '..', 'public', 'og.png');
  const sigPath = path.resolve(__dirname, '..', '.og-image-signature');

  // 增量渲染：SVG 内容 SHA-256 与存根一致且产物存在 → 跳过 sharp 渲染（省 1-2s/次构建）。
  // 站点文案/配色改动会改变 SVG 字符串 → 签名失配 → 重画并更新存根。
  const signature = crypto.createHash('sha256').update(svg).digest('hex');
  if (
    fs.existsSync(outPath) &&
    fs.existsSync(sigPath) &&
    fs.readFileSync(sigPath, 'utf-8').trim() === signature
  ) {
    console.log('✓ og.png 内容未变化，跳过渲染（签名命中）');
    return;
  }

  // palette 量化：Aurora 渐变用 256 色索引 PNG（实测 306K→175K，-43%），
  // 社交卡片非首屏资源，肉眼无感；compressionLevel 9 已是 zlib 最高
  await sharp(Buffer.from(svg, 'utf-8'))
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
  fs.writeFileSync(sigPath, signature + '\n', 'utf-8');

  const stats = fs.statSync(outPath);
  console.log(`✓ 已生成 ${outPath} (${(stats.size / 1024).toFixed(1)} KB, ${W}x${H})`);
}

generateOG().catch((err) => {
  console.error('生成 og.png 失败:', err.message);
  process.exit(1);
});
