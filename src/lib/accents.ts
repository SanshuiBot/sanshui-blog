/**
 * 主题强调色（Accent）配置
 * -----------------------------
 * 6 个 accent 色的 RGB 三元组（空格分隔），与 globals.css 中 `:root` 的
 * `--accent-*-rgb` 一一对应。AccentPicker 通过 documentElement.style.setProperty
 * 覆盖这些 CSS 变量，实现运行时换色，无需重新构建。
 *
 * 约定：
 *  - `storageKey` 与 next-themes 的 `aurora-theme` 平行，存当前 accent 预设 id。
 *  - 预设只改 6 个 accent RGB；阴影、glow、hljs、prose-article 等全部经由
 *    `rgb(var(--accent-xxx-rgb) / α)` 自动联动。
 *  - 默认预设为 `aurora`（与原站点配色完全一致）。
 */

/** 6 个 accent 通道名，与 globals.css 的 `--accent-*-rgb` 对应 */
export type AccentChannel = 'pink' | 'violet' | 'blue' | 'teal' | 'gold' | 'rose';

/** 一个预设：6 个 accent 的 RGB 三元组（空格分隔字符串，如 "168 85 247"） */
export interface AccentPreset {
  id: string;
  label: string;
  colors: Record<AccentChannel, string>;
}

export const ACCENT_STORAGE_KEY = 'aurora-accent';
export const ACCENT_CHANNELS: readonly AccentChannel[] = [
  'pink',
  'violet',
  'blue',
  'teal',
  'gold',
  'rose',
] as const;

/**
 * 6 个 accent 通道的中文标签（UI 展示用）——描述该通道的**主导用途**而非纯颜色名。
 * 注意：6 通道是协同调色板（多用于渐变组合），不存在严格的一一对应元素；
 * 标签按使用分布的主导角色命名（violet 158 处 / pink 44 / blue 36 / teal 18 / gold 14 / rose 12）。
 */
export const ACCENT_CHANNEL_LABELS: Record<AccentChannel, string> = {
  pink: '极光·标题', // Footer 极光渐变条、区块小标题（关于/友链）
  violet: '链接·高亮', // 文章链接、导航激活线、目录高亮、阴影辉光（主导色）
  blue: '阅读进度', // 阅读进度条（ScrollProgress）、统计渐变
  teal: '技能·图标', // 技能条、统计图标
  gold: '技能·点缀', // 技能条、卡片强调
  rose: '卡片·按钮', // 卡片渐变、按钮点缀
};

/** 默认预设：Aurora（与原站点 violet/pink/blue/teal/gold/rose 一致） */
export const DEFAULT_ACCENT_ID = 'aurora';

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  {
    id: 'aurora',
    label: '极光',
    colors: {
      pink: '255 110 199',
      violet: '168 85 247',
      blue: '56 189 248',
      teal: '45 212 191',
      gold: '251 191 36',
      rose: '251 113 133',
    },
  },
  {
    id: 'emerald',
    label: '翡翠',
    colors: {
      pink: '244 114 182',
      violet: '16 185 129',
      blue: '59 130 246',
      teal: '20 184 166',
      gold: '234 179 8',
      rose: '244 63 94',
    },
  },
  {
    id: 'sunset',
    label: '落日',
    colors: {
      pink: '251 113 133',
      violet: '249 115 22',
      blue: '234 88 12',
      teal: '217 119 6',
      gold: '253 224 71',
      rose: '239 68 68',
    },
  },
  {
    id: 'ocean',
    label: '深海',
    colors: {
      pink: '94 234 212',
      violet: '56 189 248',
      blue: '29 78 216',
      teal: '13 148 136',
      gold: '250 204 21',
      rose: '244 114 182',
    },
  },
  {
    id: 'sakura',
    label: '樱影',
    colors: {
      pink: '244 114 182',
      violet: '236 72 153',
      blue: '147 51 234',
      teal: '168 85 247',
      gold: '251 191 36',
      rose: '219 39 119',
    },
  },
] as const;

/** 自定义预设的中文标签 */
export const CUSTOM_ACCENT_LABEL = '自定义';

/** 自定义预设 id：用户通过色板选任意 hex 生成 */
export const CUSTOM_ACCENT_ID = 'custom';

/** 自定义预设的 localStorage 键：存 6 个 RGB 三元组的 JSON */
export const CUSTOM_ACCENT_STORAGE_KEY = 'aurora-accent-custom';

/** 按 id 取预设；找不到回退到默认预设 */
export function getPreset(id: string | null | undefined): AccentPreset {
  if (id) {
    const found = ACCENT_PRESETS.find((p) => p.id === id);
    if (found) return found;
  }
  return ACCENT_PRESETS.find((p) => p.id === DEFAULT_ACCENT_ID)!;
}

/** hex("#a855f7" 或 "a855f7") -> RGB 三元组字符串 "168 85 247"；失败回 null */
export function hexToRgb(hex: string): string | null {
  const m = hex
    .trim()
    .replace(/^#/, '')
    .match(/^([0-9a-f]{6})$/i);
  if (!m || !m[1]) return null;
  const h = m[1];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** RGB 三元组字符串 "168 85 247" -> "#a855f7" */
export function rgbToHex(rgb: string): string {
  const [r, g, b] = rgb.split(/\s+/).map((n) => parseInt(n, 10));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r!)}${toHex(g!)}${toHex(b!)}`;
}

/**
 * 从 localStorage 读自定义预设；不存在返回 null。
 * 自定义预设格式：{ id: 'custom', label: '自定义', colors: {...} }
 *
 * 校验等级与 resolveAccentColors / accentBootstrapScript 一致——只校 6 channel
 * 类型齐全，不校验 parsed.id（本仓自己写的 key，不存在被外部污染的场景）。
 * 见 ADR-0002。
 */
export function getCustomPreset(): AccentPreset | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CUSTOM_ACCENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AccentPreset>;
    if (
      parsed.label &&
      parsed.colors &&
      ACCENT_CHANNELS.every((ch) => typeof parsed.colors![ch] === 'string')
    ) {
      return {
        id: CUSTOM_ACCENT_ID,
        label: parsed.label,
        colors: parsed.colors as Record<AccentChannel, string>,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** 把自定义预设持久化到 localStorage */
export function saveCustomPreset(preset: AccentPreset): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CUSTOM_ACCENT_STORAGE_KEY, JSON.stringify(preset));
  } catch {
    // localStorage 不可用时静默失败
  }
}

/**
 * 将一个预设的 6 个 RGB 写入 documentElement.style。
 * 在客户端调用（AccentPicker 的 setAccent / 防 FOUC inline script）。
 */
export function applyAccent(preset: AccentPreset): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const ch of ACCENT_CHANNELS) {
    root.style.setProperty(`--accent-${ch}-rgb`, preset.colors[ch]);
  }
}

/**
 * 防 FOUC 解析逻辑的纯函数版本（与 accentBootstrapScript 内的逻辑保持一致，可单测）：
 * 读 storage id → custom 覆盖 → 预设查找 → 默认回退，返回要写入的 colors。
 */
export function resolveAccentColors(
  id: string | null,
  customRaw: string | null,
): Record<AccentChannel, string> | null {
  if (id === CUSTOM_ACCENT_ID) {
    try {
      if (customRaw) {
        const parsed = JSON.parse(customRaw) as Partial<AccentPreset>;
        if (
          parsed.colors &&
          ACCENT_CHANNELS.every((ch) => typeof parsed.colors![ch] === 'string')
        ) {
          return parsed.colors as Record<AccentChannel, string>;
        }
      }
    } catch {
      // 自定义 JSON 损坏时回退到预设
    }
  }
  const preset = getPreset(id);
  return preset.colors;
}

/**
 * 防 FOUC inline script：首屏前同步读 localStorage 并写 CSS 变量。
 * 由本模块生成（与 resolveAccentColors 共享数据源），逻辑嵌入在自执行函数中，
 * 不依赖外部模块，可安全内联在 <head>。
 *
 * 校验等级与 resolveAccentColors 一致——6 channel 缺一就 reject（回退默认预设），
 * 见 ADR-0002。partial channel 不再默写部分变量（混合调色盘 FOUC 闪屏的根因）。
 */
export const accentBootstrapScript = `(function(){
  try {
    var id = window.localStorage.getItem('${ACCENT_STORAGE_KEY}');
    var presets = ${JSON.stringify(ACCENT_PRESETS.map((p) => ({ id: p.id, colors: p.colors })))};
    var CH = ['pink','violet','blue','teal','gold','rose'];
    var def = presets.find(function(p){return p.id==='${DEFAULT_ACCENT_ID}';});
    var target;
    if (id === '${CUSTOM_ACCENT_ID}') {
      try {
        var raw = window.localStorage.getItem('${CUSTOM_ACCENT_STORAGE_KEY}');
        if (raw) {
          var p = JSON.parse(raw);
          if (p.colors && CH.every(function(c){return typeof p.colors[c]==='string';})) {
            target = p;
          }
        }
      } catch (e2) {}
    }
    if (!target) {
      target = presets.find(function(p){return p.id===id;}) || def;
    }
    if (!target || !target.colors) return;
    var root = document.documentElement;
    Object.keys(target.colors).forEach(function(ch){
      root.style.setProperty('--accent-' + ch + '-rgb', target.colors[ch]);
    });
  } catch (e) {}
})();`;

/**
 * 主题（亮/暗）防 FOUC 同步脚本。
 *
 * 为什么需要它：
 * `next-themes` 的 `ThemeProvider` 渲染在 `<body>` 内的 client 组件里
 * （见 Providers.tsx），其防 FOUC inline script 因此被注入到 `<body>`
 * 而非 `<head>`——首屏前 `<html>` 没有 `.dark` 类，浏览器先渲染亮色、
 * 再被 body 内脚本切暗色 → FOUC 闪屏。
 *
 * 本脚本在 `<head>` 内同步跑（与 accentBootstrapScript 并列），首屏前
 * 设好 `.dark` 类，消除 FOUC。逻辑与 next-themes 内联脚本保持一致：
 *   读 storageKey（默认 'theme'）→ 未设置取 defaultTheme（'system'）
 *   → 'system' 跟随 prefers-color-scheme → 否则直接对应 dark/light
 *
 * 参数化：与 ThemeProvider 的 props 对齐
 *   storageKey='aurora-theme'、defaultTheme='system'、enableSystem=true
 *
 * 注意：本脚本只在首屏前跑一次，不影响后续 setTheme 的运行时切换。
 * 点击切换的「等一会才变」由 disableTransitionOnChange 单独解决。
 */
export const themeBootstrapScript = `try {
  var key = 'aurora-theme';
  var stored = localStorage.getItem(key);
  var theme = stored || 'system';
  var isDark;
  if (theme === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = theme === 'dark';
  }
  var root = document.documentElement;
  if (isDark) root.classList.add('dark');
  else root.classList.remove('dark');
  root.style.colorScheme = isDark ? 'dark' : 'light';
} catch (e) {}`;
