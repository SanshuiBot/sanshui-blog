'use client';
import { useState, useEffect, useRef } from 'react';
import { Palette, Check } from 'lucide-react';
import Tooltip from '@/components/UI/Tooltip';
import {
  ACCENT_PRESETS,
  ACCENT_STORAGE_KEY,
  ACCENT_CHANNELS,
  ACCENT_CHANNEL_LABELS,
  CUSTOM_ACCENT_ID,
  CUSTOM_ACCENT_LABEL,
  DEFAULT_ACCENT_ID,
  applyAccent,
  getPreset,
  getCustomPreset,
  saveCustomPreset,
  hexToRgb,
  rgbToHex,
  type AccentPreset,
} from '@/lib/accents';

/**
 * 主题强调色选择器
 * -----------------------------
 * 点击调色板图标弹出 Popover：
 *  - 上半：5 个预设配色，点击即应用
 *  - 下半：「自定义」入口，6 个通道各一个 <input type="color">，
 *    任一改变即生成 custom 预设 → saveCustomPreset + applyAccent
 *
 * 防 FOUC 由 layout.tsx 的 inline script 处理（首屏即应用上次的 accent）。
 */
export default function AccentPicker() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(DEFAULT_ACCENT_ID);
  // 6 个通道的自定义 hex 值；初始从当前激活预设的 RGB 反推
  const [customHex, setCustomHex] = useState<Record<string, string>>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  // 初始化：从 localStorage 读上次的 accent + 已保存的自定义预设
  useEffect(() => {
    const stored =
      typeof window !== 'undefined' ? window.localStorage.getItem(ACCENT_STORAGE_KEY) : null;
    const custom = getCustomPreset();
    // 若激活的是 custom 且有保存的自定义预设，用自定义预设的色作为初始值
    let preset = getPreset(stored);
    if (stored === CUSTOM_ACCENT_ID && custom) {
      preset = custom;
    }
    setActiveId(preset.id);
    const initial: Record<string, string> = {};
    for (const ch of ACCENT_CHANNELS) {
      initial[ch] = rgbToHex(preset.colors[ch]);
    }
    setCustomHex(initial);
  }, []);

  // 点击外部关闭 Popover
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // 延迟绑定，避免触发 Popover 的同一次点击
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // 选中预设（预设或自定义）
  const handleSelect = (id: string) => {
    let preset: AccentPreset;
    if (id === CUSTOM_ACCENT_ID) {
      // 从当前 customHex 构造自定义预设；customHex 初始化为合法值，此处不会 null
      preset = buildCustomPreset(customHex) ?? getPreset(DEFAULT_ACCENT_ID);
    } else {
      preset = getPreset(id);
    }
    setActiveId(preset.id);
    applyAccent(preset);
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, preset.id);
    } catch {
      // localStorage 不可用（隐私模式等）时静默失败
    }
    setOpen(false);
  };

  // 自定义通道色值变更
  const handleCustomChange = (ch: string, hex: string) => {
    const next = { ...customHex, [ch]: hex };
    setCustomHex(next);
    const preset = buildCustomPreset(next);
    if (!preset) return;
    setActiveId(CUSTOM_ACCENT_ID);
    applyAccent(preset);
    saveCustomPreset(preset);
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, CUSTOM_ACCENT_ID);
    } catch {
      // 静默失败
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <Tooltip label="主题强调色" disabled={open}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          aria-label="选择主题色"
          aria-expanded={open}
        >
          <Palette size={16} />
        </button>
      </Tooltip>

      {open && (
        <div
          role="dialog"
          aria-label="主题强调色"
          className="absolute right-0 mt-2 w-64 rounded-xl glass-heavy p-2 shadow-soft z-50"
        >
          <div className="px-2 py-1.5 text-xs text-gray-500 font-medium">主题强调色</div>

          {/* 预设列表 */}
          {ACCENT_PRESETS.map((preset) => {
            const active = preset.id === activeId;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelect(preset.id)}
                className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg transition-all cursor-pointer ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-sm font-medium">{preset.label}</span>
                <span className="flex items-center gap-1">
                  {(['violet', 'pink', 'blue'] as const).map((ch) => (
                    <span
                      key={ch}
                      className="w-3 h-3 rounded-full border border-white/10"
                      style={{ background: `rgb(${preset.colors[ch]})` }}
                    />
                  ))}
                  {active && <Check size={14} className="ml-1" />}
                </span>
              </button>
            );
          })}

          {/* 自定义入口 */}
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="px-2 py-1 text-xs text-gray-500 font-medium flex items-center justify-between">
              <span>{CUSTOM_ACCENT_LABEL}</span>
              {activeId === CUSTOM_ACCENT_ID && <Check size={12} />}
            </div>
            <div className="grid grid-cols-3 gap-1.5 px-1 pt-1.5 pb-1">
              {ACCENT_CHANNELS.map((ch) => {
                const hex = customHex[ch] || '#a855f7';
                return (
                  <label
                    key={ch}
                    className="group relative flex flex-col items-center gap-1 cursor-pointer rounded-lg p-1.5 transition-all hover:bg-white/5"
                    title={ACCENT_CHANNEL_LABELS[ch]}
                  >
                    {/* 精致色盘：外层微光晕 + 内层当前色圆点 */}
                    <span
                      className="relative w-8 h-8 rounded-full transition-transform group-hover:scale-110"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${hex}, ${hex}cc 70%, ${hex}88)`,
                        boxShadow: `0 0 0 1px rgba(255,255,255,0.15), 0 2px 8px ${hex}66, inset 0 1px 2px rgba(255,255,255,0.25)`,
                      }}
                    >
                      {/* 中心高光，模拟玻璃球质感 */}
                    </span>
                    {/* 隐藏的原生 color input，仅作拾色器入口 */}
                    <input
                      type="color"
                      value={hex}
                      onChange={(e) => handleCustomChange(ch, e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      tabIndex={-1}
                      aria-label={`${ACCENT_CHANNEL_LABELS[ch]}颜色`}
                    />
                    <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors">
                      {ACCENT_CHANNEL_LABELS[ch]}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 从 6 个 hex 值构造 custom AccentPreset。
 * 任一 hex 非法（hexToRgb 返回 null）返回 null。
 */
function buildCustomPreset(hexMap: Record<string, string>): AccentPreset | null {
  const colors: Partial<Record<(typeof ACCENT_CHANNELS)[number], string>> = {};
  for (const ch of ACCENT_CHANNELS) {
    const rgb = hexToRgb(hexMap[ch] || '');
    if (rgb === null) return null;
    colors[ch] = rgb;
  }
  return {
    id: CUSTOM_ACCENT_ID,
    label: '自定义',
    colors: colors as AccentPreset['colors'],
  };
}
