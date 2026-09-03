'use client';
import { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import Tooltip from '@/components/UI/Tooltip';
import { useDismiss } from '@/components/UI/useDismiss';
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
 *    任一改变即生成 custom 预设 → 即时 applyAccent（拖拽实时预览）
 *    + 尾随防抖持久化（localStorage 同步写合并到松手后一次，避免拖拽卡顿）
 *
 * 防 FOUC 由 layout.tsx 的 inline script 处理（首屏即应用上次的 accent）。
 */
export default function AccentPicker() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(DEFAULT_ACCENT_ID);
  // 6 个通道的自定义 hex 值；初始从当前激活预设的 RGB 反推
  const [customHex, setCustomHex] = useState<Record<string, string>>({});
  const popoverRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  // 持久化尾随防抖定时器（自定义色拖拽期间只写 CSS 变量，localStorage 合写一次）
  const persistTimer = useRef<number | null>(null);

  // 卸载时清掉未落盘的定时器（防御性；组件常驻 Navbar，正常不会触发）
  useEffect(() => {
    return () => {
      if (persistTimer.current !== null) window.clearTimeout(persistTimer.current);
    };
  }, []);

  /**
   * 应用 accent（即时视觉）+ 持久化。
   * immediate=true（预设单选）：立即写 localStorage；false（自定义拖拽）：
   * 尾随防抖 400ms 合写——拖拽过程每个 onChange 都做同步 localStorage.setItem
   * 会阻塞主线程造成卡顿，改为松手停顿后写一次。
   */
  const persistAccent = (preset: AccentPreset, id: string, immediate: boolean) => {
    applyAccent(preset);
    if (persistTimer.current !== null) window.clearTimeout(persistTimer.current);
    const write = () => {
      persistTimer.current = null;
      if (id === CUSTOM_ACCENT_ID) saveCustomPreset(preset);
      try {
        window.localStorage.setItem(ACCENT_STORAGE_KEY, id);
      } catch {
        // localStorage 不可用（隐私模式等）时静默失败
      }
    };
    if (immediate) write();
    else persistTimer.current = window.setTimeout(write, 400);
  };

  // 打开时聚焦第一个预设按钮，让键盘用户无需 Tab 导航即可开始
  useEffect(() => {
    if (!open) return;
    // 延迟等待 AnimatePresence 渲染完成后聚焦
    const t = setTimeout(() => firstButtonRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  // 初始化：从 localStorage 读上次的 accent + 已保存的自定义预设。
  // 放到首次点击时惰性执行（事件处理器内 setState），避免挂载 effect 内同步 setState。
  const initializedRef = useRef(false);
  const handleOpen = () => {
    if (!initializedRef.current) {
      initializedRef.current = true;
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
    }
    setOpen((v) => !v);
  };

  // 点击外部 / Esc 关闭（外点判定 + 延迟绑定统一收口在 useDismiss）
  useDismiss(popoverRef, () => setOpen(false), { enabled: open });

  // 选中预设（预设或自定义）——单击，立即持久化
  const handleSelect = (id: string) => {
    let preset: AccentPreset;
    if (id === CUSTOM_ACCENT_ID) {
      // 从当前 customHex 构造自定义预设；customHex 初始化为合法值，此处不会 null
      preset = buildCustomPreset(customHex) ?? getPreset(DEFAULT_ACCENT_ID);
    } else {
      preset = getPreset(id);
    }
    setActiveId(preset.id);
    persistAccent(preset, preset.id, true);
    setOpen(false);
  };

  // 自定义通道色值变更（拖拽高频触发：即时换色，localStorage 尾随防抖合写）
  const handleCustomChange = (ch: string, hex: string) => {
    const next = { ...customHex, [ch]: hex };
    setCustomHex(next);
    const preset = buildCustomPreset(next);
    if (!preset) return;
    setActiveId(CUSTOM_ACCENT_ID);
    persistAccent(preset, CUSTOM_ACCENT_ID, false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <Tooltip label="主题强调色" disabled={open}>
        <button
          onClick={handleOpen}
          className="nav-icon-btn p-2 w-9 h-9 flex items-center justify-center rounded-xl text-stone-600 hover:text-stone-900 hover:bg-black/[0.03] cursor-pointer dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5"
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
          className="absolute right-0 mt-2 w-64 rounded-xl glass-heavy p-2 z-50"
        >
          <div className="px-2 py-1.5 text-xs text-stone-500 font-medium dark:text-gray-500">
            主题强调色
          </div>

          {/* 预设列表 */}
          {ACCENT_PRESETS.map((preset, idx) => {
            const active = preset.id === activeId;
            return (
              <button
                ref={idx === 0 ? firstButtonRef : undefined}
                key={preset.id}
                onClick={() => handleSelect(preset.id)}
                className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg transition-all cursor-pointer ${
                  active
                    ? 'bg-black/[0.06] text-stone-900 dark:bg-white/10 dark:text-white'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-black/[0.03] dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
                }`}
              >
                <span className="text-sm font-medium">{preset.label}</span>
                <span className="flex items-center gap-1">
                  {(['violet', 'pink', 'blue'] as const).map((ch) => (
                    <span
                      key={ch}
                      className="w-3 h-3 rounded-full border border-black/[0.1] dark:border-white/10"
                      style={{ background: `rgb(${preset.colors[ch]})` }}
                    />
                  ))}
                  {active && <Check size={14} className="ml-1" />}
                </span>
              </button>
            );
          })}

          {/* 自定义入口 */}
          <div className="mt-2 pt-2 border-t border-black/[0.1] dark:border-white/10">
            <div className="px-2 py-1 text-xs text-stone-500 font-medium flex items-center justify-between dark:text-gray-500">
              <span>{CUSTOM_ACCENT_LABEL}</span>
              {activeId === CUSTOM_ACCENT_ID && <Check size={12} />}
            </div>
            <div className="grid grid-cols-3 gap-1.5 px-1 pt-1.5 pb-1">
              {ACCENT_CHANNELS.map((ch) => {
                const hex = customHex[ch] || '#a855f7';
                return (
                  <label
                    key={ch}
                    className="group relative flex flex-col items-center gap-1 cursor-pointer rounded-lg p-1.5 transition-all hover:bg-black/[0.03] focus-within:ring-2 focus-within:ring-accent-violet/50 dark:hover:bg-white/5"
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
                      name={`accent-${ch}`}
                      value={hex}
                      onChange={(e) => handleCustomChange(ch, e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label={`${ACCENT_CHANNEL_LABELS[ch]}颜色`}
                    />
                    <span className="text-[10px] text-stone-500 group-hover:text-stone-700 transition-colors dark:text-gray-500 dark:group-hover:text-gray-300">
                      {ACCENT_CHANNEL_LABELS[ch]}
                    </span>
                  </label>
                );
              })}
            </div>
            {/* 恢复默认：清掉未落盘的防抖写，清空自定义预设并重置到 aurora */}
            {activeId === CUSTOM_ACCENT_ID && (
              <button
                onClick={() => {
                  // 先取消 pending 的防抖持久化，防止随后触发覆盖刚恢复的默认色
                  if (persistTimer.current !== null) {
                    window.clearTimeout(persistTimer.current);
                    persistTimer.current = null;
                  }
                  const defaultPreset = getPreset(DEFAULT_ACCENT_ID);
                  setActiveId(DEFAULT_ACCENT_ID);
                  applyAccent(defaultPreset);
                  try {
                    window.localStorage.removeItem(ACCENT_STORAGE_KEY);
                  } catch {
                    /* 静默失败 */
                  }
                }}
                className="mt-2 w-full text-xs text-stone-500 hover:text-accent-violet transition-colors text-center cursor-pointer dark:text-gray-500"
              >
                恢复默认配色
              </button>
            )}
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
