/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 生成 public/og.png —— 社交分享卡片图（1200×630，纯 Node 零依赖 PNG 编码）。
 * -----------------------------
 * 不依赖 sharp（sharp 是 Next 可选依赖，Windows 下可能未编译，且 SVG 文字渲染
 * 依赖系统字体，中文不可靠），用 zlib + 手写 PNG chunk 直接编码 RGBA 像素：
 *  - 深色底 + Aurora 对角渐变（5 个 accent 色插值）
 *  - 中心上方径向辉光（模拟站点 body::after 的 glow）
 *  - 56px 网格线 + 角落暗角（呼应站点背景设计）
 *
 * 触发点：npm run prebuild（构建前自动重新生成，确定性输出，不会产生 git 噪音）。
 */
const zlib = require('node:zlib');
const fs = require('node:fs');
const path = require('node:path');

const W = 1200;
const H = 630;

/* ── PNG 编码器（最小实现） ── */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/* ── 像素绘制 ── */
/** 5 个 accent 色的调色板（与 src/lib/accents.ts ACCENT_PRESETS 同源色） */
const PALETTE = [
  { p: 0.0, rgb: [255, 110, 199] }, // pink
  { p: 0.25, rgb: [168, 85, 247] }, // violet
  { p: 0.5, rgb: [56, 189, 248] }, // blue
  { p: 0.7, rgb: [45, 212, 191] }, // teal
  { p: 1.0, rgb: [251, 191, 36] }, // gold
];

/** 沿调色板插值取色 */
function paletteAt(t) {
  const clamped = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < PALETTE.length - 2 && PALETTE[i + 1].p < clamped) i++;
  const a = PALETTE[i];
  const b = PALETTE[i + 1];
  const local = (clamped - a.p) / (b.p - a.p || 1);
  return [
    Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * local),
    Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * local),
    Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * local),
  ];
}

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [
  Math.round(lerp(c1[0], c2[0], t)),
  Math.round(lerp(c1[1], c2[1], t)),
  Math.round(lerp(c1[2], c2[2], t)),
];

function colorAt(x, y) {
  const nx = x / W;
  const ny = y / H;

  // 1. 对角渐变底色（微微调暗，保证深色底）
  let rgb = paletteAt(nx * 0.72 + ny * 0.3);
  rgb = mix(rgb, [5, 5, 10], 0.38);

  // 2. 中心辉光（椭圆，偏上方，模拟站点 glow）
  const gx = (nx - 0.5) / 0.45;
  const gy = (ny - 0.4) / 0.38;
  const glow = Math.exp(-(gx * gx + gy * gy));
  rgb = mix(rgb, [255, 255, 255], glow * 0.16);

  // 3. 56px 网格线（径向 mask 淡出，呼应站点背景）
  const grid = Math.min(x % 56, y % 56) < 1 ? 1 : 0;
  const dist = Math.hypot((nx - 0.5) / 0.55, (ny - 0.42) / 0.5);
  const gridFade = grid * Math.max(0, 1 - dist * 1.15) * 0.055;
  rgb = mix(rgb, [255, 255, 255], gridFade);

  // 4. 角落暗角
  const corner = Math.max(0, Math.hypot(nx - 0.5, ny - 0.5) - 0.42);
  rgb = mix(rgb, [2, 2, 6], Math.min(0.55, corner * 0.8));

  return [rgb[0], rgb[1], rgb[2], 255];
}

/* ── 编码输出 ── */
const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  const rowStart = y * (1 + W * 4);
  raw[rowStart] = 0; // filter: None
  for (let x = 0; x < W; x++) {
    const [r, g, b, a] = colorAt(x, y);
    const o = rowStart + 1 + x * 4;
    raw[o] = r;
    raw[o + 1] = g;
    raw[o + 2] = b;
    raw[o + 3] = a;
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type: RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const outPath = path.resolve(__dirname, '..', 'public', 'og.png');
fs.writeFileSync(outPath, png);
console.log(`✓ 已生成 ${outPath} (${(png.length / 1024).toFixed(1)} KB, ${W}x${H})`);
