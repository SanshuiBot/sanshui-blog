/**
 * 平台检测 —— 仅用于 UI 展示差异（快捷键提示等）
 * -----------------------------
 * SSR 安全：`typeof navigator === 'undefined'` 时默认按非 Mac 语义返回，
 * 避免首屏 hydration 文本不一致。客户端挂载后再读真实 navigator。
 */

/** 是否为桌面 macOS（⌘ 修饰键平台）。
 * 仅认 navigator.platform 的 mac 前缀——iPhone/iPad/iPod 的 platform 分别是
 * 'iPhone'/'iPad'/'iPod'，不会命中；触屏设备没有实体 ⌘ 修饰键，不应显示 ⌘K
 * 快捷键文案。iPadOS 桌面模式（外接键盘）platform 为 'MacIntel' 会命中，
 * 此时 ⌘K 快捷键确实可用，符合预期。 */
const isApplePlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /^mac/i.test(navigator.platform || '');
};

/** 当前平台对应的搜索快捷键文案，如 "⌘K" / "Ctrl+K" */
export const searchHotkeyLabel = (): string => (isApplePlatform() ? '⌘K' : 'Ctrl+K');
