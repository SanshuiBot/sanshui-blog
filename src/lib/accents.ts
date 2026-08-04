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

/** 6 个 accent 通道的中文标签（UI 展示用） */
export const ACCENT_CHANNEL_LABELS: Record<AccentChannel, string> = {
  pink: '樱粉',
  violet: '幻紫',
  blue: '湛蓝',
  teal: '青碧',
  gold: '鎏金',
  rose: '玫红',
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
 */
export function getCustomPreset(): AccentPreset | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CUSTOM_ACCENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AccentPreset>;
    if (
      parsed.id === CUSTOM_ACCENT_ID &&
      parsed.label &&
      parsed.colors &&
      ACCENT_CHANNELS.every((ch) => typeof parsed.colors![ch] === 'string')
    ) {
      return parsed as AccentPreset;
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
