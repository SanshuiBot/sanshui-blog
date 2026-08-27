import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  hexToRgb,
  rgbToHex,
  getPreset,
  DEFAULT_ACCENT_ID,
  ACCENT_PRESETS,
  ACCENT_CHANNELS,
  ACCENT_STORAGE_KEY,
  CUSTOM_ACCENT_ID,
  CUSTOM_ACCENT_STORAGE_KEY,
  resolveAccentColors,
  accentBootstrapScript,
  themeBootstrapScript,
  THEME_COLORS,
} from '@/lib/accents';

describe('hexToRgb', () => {
  it('converts 6-digit hex with # to rgb triplet', () => {
    expect(hexToRgb('#a855f7')).toBe('168 85 247');
  });

  it('accepts hex without leading #', () => {
    expect(hexToRgb('a855f7')).toBe('168 85 247');
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(hexToRgb('  #A855F7  ')).toBe('168 85 247');
  });

  it('converts boundary colors', () => {
    expect(hexToRgb('#000000')).toBe('0 0 0');
    expect(hexToRgb('#ffffff')).toBe('255 255 255');
  });

  it('returns null for invalid input', () => {
    expect(hexToRgb('#a855f')).toBeNull(); // 5 位
    expect(hexToRgb('#a855f7aa')).toBeNull(); // 8 位（含 alpha）
    expect(hexToRgb('#gggggg')).toBeNull(); // 非法 hex
    expect(hexToRgb('')).toBeNull();
  });
});

describe('rgbToHex', () => {
  it('converts rgb triplet to lowercase hex with #', () => {
    expect(rgbToHex('168 85 247')).toBe('#a855f7');
  });

  it('pads single-digit hex components', () => {
    expect(rgbToHex('10 15 5')).toBe('#0a0f05');
    expect(rgbToHex('0 0 0')).toBe('#000000');
  });
});

describe('getPreset', () => {
  it('returns the preset matching the id', () => {
    const p = getPreset('aurora');
    expect(p.id).toBe('aurora');
    expect(p.colors.violet).toBe('168 85 247');
  });

  it('falls back to the default preset for unknown id', () => {
    expect(getPreset('nonexistent').id).toBe(DEFAULT_ACCENT_ID);
  });

  it('falls back to the default preset for null/undefined', () => {
    expect(getPreset(null).id).toBe(DEFAULT_ACCENT_ID);
    expect(getPreset(undefined).id).toBe(DEFAULT_ACCENT_ID);
  });
});

describe('resolveAccentColors（防 FOUC 解析逻辑纯函数）', () => {
  it('预设 id 返回对应 colors', () => {
    expect(resolveAccentColors('sunset', null)).toEqual(getPreset('sunset').colors);
  });

  it('未知/空 id 回退到默认预设', () => {
    expect(resolveAccentColors('nonexistent', null)).toEqual(getPreset(DEFAULT_ACCENT_ID).colors);
    expect(resolveAccentColors(null, null)).toEqual(getPreset(DEFAULT_ACCENT_ID).colors);
  });

  it('custom id + 合法 JSON 返回自定义 colors', () => {
    const custom = {
      colors: {
        pink: '1 2 3',
        violet: '4 5 6',
        blue: '7 8 9',
        teal: '10 11 12',
        gold: '13 14 15',
        rose: '16 17 18',
      },
    };
    const colors = resolveAccentColors(CUSTOM_ACCENT_ID, JSON.stringify(custom));
    expect(colors?.violet).toBe('4 5 6');
  });

  it('custom id + 损坏 JSON 回退到默认预设', () => {
    expect(resolveAccentColors(CUSTOM_ACCENT_ID, '{bad json')).toEqual(
      getPreset(DEFAULT_ACCENT_ID).colors,
    );
  });
});

describe('accentBootstrapScript（防 FOUC 脚本与纯函数行为一致）', () => {
  /** 用 stub 的 window/document 执行生成的脚本，返回写入的 CSS 变量 */
  function runScript(store: Record<string, string | null>): Record<string, string> {
    const vars: Record<string, string> = {};
    const origWindow = globalThis.window;
    const origDocument = globalThis.document;
    (globalThis as { window?: unknown }).window = {
      localStorage: { getItem: (k: string) => store[k] ?? null },
    };
    (globalThis as { document?: unknown }).document = {
      documentElement: { style: { setProperty: (k: string, v: string) => void (vars[k] = v) } },
    };
    try {
      new Function(accentBootstrapScript)();
    } finally {
      (globalThis as { window?: unknown }).window = origWindow;
      (globalThis as { document?: unknown }).document = origDocument;
    }
    return vars;
  }

  it('预设 id：脚本写入的 CSS 变量与 resolveAccentColors 一致', () => {
    const vars = runScript({ [ACCENT_STORAGE_KEY]: 'ocean' });
    const expected = resolveAccentColors('ocean', null)!;
    for (const ch of ACCENT_CHANNELS) {
      expect(vars[`--accent-${ch}-rgb`]).toBe(expected[ch]);
    }
  });

  it('custom id：脚本应用自定义 colors', () => {
    const custom = {
      id: CUSTOM_ACCENT_ID,
      colors: {
        pink: '11 12 13',
        violet: '21 22 23',
        blue: '31 32 33',
        teal: '41 42 43',
        gold: '51 52 53',
        rose: '61 62 63',
      },
    };
    const vars = runScript({
      [ACCENT_STORAGE_KEY]: CUSTOM_ACCENT_ID,
      [CUSTOM_ACCENT_STORAGE_KEY]: JSON.stringify(custom),
    });
    expect(vars['--accent-violet-rgb']).toBe('21 22 23');
  });

  it('未知 id：脚本回退到默认预设', () => {
    const vars = runScript({ [ACCENT_STORAGE_KEY]: 'nonexistent' });
    const expected = getPreset(DEFAULT_ACCENT_ID).colors;
    expect(vars['--accent-violet-rgb']).toBe(expected.violet);
  });

  // ADR-0002 边角矩阵——固化 inline script 与 resolveAccentColors 行为等价，
  // 防止三套解析器再发散（partial channel FOUC 闪屏是 ③ 的核心 bug）。

  it('partial channel：脚本与纯函数都回退默认（不默写部分变量）', () => {
    // custom JSON 只含 1/6 channel——inline script 历史会默写部分变量造成混合调色盘 FOUC
    const partial = { colors: { violet: '1 2 3' } };
    const raw = JSON.stringify(partial);
    const vars = runScript({
      [ACCENT_STORAGE_KEY]: CUSTOM_ACCENT_ID,
      [CUSTOM_ACCENT_STORAGE_KEY]: raw,
    });
    // 脚本回退默认预设
    const expected = getPreset(DEFAULT_ACCENT_ID).colors;
    expect(vars['--accent-violet-rgb']).toBe(expected.violet);
    // 纯函数同样回退（双向断言等价性）
    const resolved = resolveAccentColors(CUSTOM_ACCENT_ID, raw);
    expect(resolved).toEqual(expected);
  });

  it('corrupt JSON：脚本与纯函数都回退默认', () => {
    const raw = '{bad json';
    const vars = runScript({
      [ACCENT_STORAGE_KEY]: CUSTOM_ACCENT_ID,
      [CUSTOM_ACCENT_STORAGE_KEY]: raw,
    });
    const expected = getPreset(DEFAULT_ACCENT_ID).colors;
    expect(vars['--accent-violet-rgb']).toBe(expected.violet);
    expect(resolveAccentColors(CUSTOM_ACCENT_ID, raw)).toEqual(expected);
  });

  it('custom id 但 CUSTOM_ACCENT_STORAGE_KEY 为 null：脚本与纯函数都回退默认', () => {
    // 用户没存过自定义预设，getItem 返回 null
    const vars = runScript({
      [ACCENT_STORAGE_KEY]: CUSTOM_ACCENT_ID,
      [CUSTOM_ACCENT_STORAGE_KEY]: null,
    });
    const expected = getPreset(DEFAULT_ACCENT_ID).colors;
    expect(vars['--accent-violet-rgb']).toBe(expected.violet);
    expect(resolveAccentColors(CUSTOM_ACCENT_ID, null)).toEqual(expected);
  });

  it('parsed.id !== custom：getCustomPreset 不再校验 id（ADR-0002 统一校验等级）', () => {
    // localStorage 里 custom key 被写入非 custom id 的 JSON——
    // 删 parsed.id 校验后，只要 6 channel 齐全就应接受
    const wrongId = {
      id: 'aurora', // 不是 custom，但 6 channel 齐全
      label: '自定义',
      colors: {
        pink: '11 12 13',
        violet: '21 22 23',
        blue: '31 32 33',
        teal: '41 42 43',
        gold: '51 52 53',
        rose: '61 62 63',
      },
    };
    const vars = runScript({
      [ACCENT_STORAGE_KEY]: CUSTOM_ACCENT_ID,
      [CUSTOM_ACCENT_STORAGE_KEY]: JSON.stringify(wrongId),
    });
    // 脚本读 custom key，6 channel 齐全 → 应用（不再因 parsed.id reject）
    expect(vars['--accent-violet-rgb']).toBe('21 22 23');
    // 纯函数同样接受
    expect(resolveAccentColors(CUSTOM_ACCENT_ID, JSON.stringify(wrongId))?.violet).toBe('21 22 23');
  });
});

describe('globals.css :root 默认 accent 变量与 ACCENT_PRESETS 一致（跨语言契约）', () => {
  it('六个通道值完全匹配 aurora 预设', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/globals.css'), 'utf-8');
    const aurora = ACCENT_PRESETS[0]!;
    for (const ch of ACCENT_CHANNELS) {
      const m = new RegExp(`--accent-${ch}-rgb:\\s*([^;]+);`).exec(css);
      expect(m?.[1]?.trim()).toBe(aurora.colors[ch]);
    }
  });

  it('亮色下 --color-accent-* 派生加深（对比度增强，不覆盖原始 RGB）', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/globals.css'), 'utf-8');
    for (const ch of ACCENT_CHANNELS) {
      // 主题令牌在亮色分支 color-mix 加深
      expect(css).toContain(`--color-accent-${ch}: color-mix`);
      // 原始 --accent-*-rgb 保持纯值（装饰/辉光走纯色）
      const m = new RegExp(`--accent-${ch}-rgb:\\s*([^;]+);`).exec(css);
      expect(m?.[1]?.trim()).toBe(ACCENT_PRESETS[0]!.colors[ch]);
    }
  });
});

describe('accentBootstrapScript 通道名由 ACCENT_CHANNELS 生成（消除硬编码重复）', () => {
  it('脚本内嵌的 CH 数组与 ACCENT_CHANNELS 完全一致', () => {
    expect(accentBootstrapScript).toContain(`var CH = ${JSON.stringify(ACCENT_CHANNELS)};`);
  });
});

describe('themeBootstrapScript（防 FOUC：.dark 类 + meta theme-color + 遗留迁移）', () => {
  interface RunResult {
    classes: string[];
    metaContent: string | null;
    colorScheme: string;
  }

  /** 用 stub 的 window/document 执行 themeBootstrapScript，返回类操作/meta 写入/color-scheme */
  function runThemeScript(store: Record<string, string | null>, hasMeta = true): RunResult {
    const classes: string[] = [];
    const metaContent: string[] = [];
    const style: Record<string, string> = {};
    const origWindow = globalThis.window;
    const origDocument = globalThis.document;
    const origLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => void (store[k] = v),
    };
    (globalThis as { window?: unknown }).window = { localStorage: storage };
    // themeBootstrapScript 用裸 localStorage（非 window.localStorage），
    // 浏览器里经全局作用域解析，测试环境须同样挂到 globalThis。
    (globalThis as { localStorage?: unknown }).localStorage = storage;
    (globalThis as { document?: unknown }).document = {
      documentElement: {
        classList: {
          add: (c: string) => void classes.push(`+${c}`),
          remove: (c: string) => void classes.push(`-${c}`),
        },
        style,
      },
      querySelector: (sel: string) => {
        if (sel === 'meta[name="theme-color"]' && hasMeta) {
          return { setAttribute: (_k: string, v: string) => void metaContent.push(v) };
        }
        return null;
      },
    };
    try {
      new Function(themeBootstrapScript)();
    } finally {
      (globalThis as { window?: unknown }).window = origWindow;
      (globalThis as { document?: unknown }).document = origDocument;
      (globalThis as { localStorage?: unknown }).localStorage = origLocalStorage;
    }
    return { classes, metaContent: metaContent[0] ?? null, colorScheme: style.colorScheme ?? '' };
  }

  it('stored dark：加 .dark 类 + meta 写暗色', () => {
    const r = runThemeScript({ 'aurora-theme': 'dark' });
    expect(r.classes).toContain('+dark');
    expect(r.metaContent).toBe(THEME_COLORS.dark);
    expect(r.colorScheme).toBe('dark');
  });

  it('stored light：不加 .dark 类 + meta 写亮色', () => {
    const r = runThemeScript({ 'aurora-theme': 'light' });
    expect(r.classes).toContain('-dark');
    expect(r.metaContent).toBe(THEME_COLORS.light);
    expect(r.colorScheme).toBe('light');
  });

  it('未存值（null）按默认亮色处理', () => {
    const r = runThemeScript({});
    expect(r.classes).toContain('-dark');
    expect(r.metaContent).toBe(THEME_COLORS.light);
  });

  it('遗留 stored system：迁移为亮色并改写存储（system 档已下线）', () => {
    const store: Record<string, string | null> = { 'aurora-theme': 'system' };
    const r = runThemeScript(store);
    // 存储值被改写为 light（防止 next-themes 复活 system 逻辑），首屏按亮色渲染
    expect(store['aurora-theme']).toBe('light');
    expect(r.classes).toContain('-dark');
    expect(r.metaContent).toBe(THEME_COLORS.light);
  });

  it('meta 标签缺失时不抛错（防御性）', () => {
    const r = runThemeScript({ 'aurora-theme': 'dark' }, false);
    expect(r.classes).toContain('+dark');
    expect(r.metaContent).toBeNull();
  });
});
