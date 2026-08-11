/**
 * 平台检测 —— 仅用于 UI 展示差异（快捷键提示等）
 * -----------------------------
 * SSR 安全：`typeof navigator === 'undefined'` 时默认按 Mac 语义返回，
 * 避免首屏 hydration 文本不一致。客户端挂载后再读真实 navigator。
 */

/** 是否为 Apple 修饰键平台（macOS / iPadOS / iOS） */
export const isApplePlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const p = (navigator.platform || '').toLowerCase();
  const ua = (navigator.userAgent || '').toLowerCase();
  return /mac|iphone|ipad|ipod/.test(p) || /mac|iphone|ipad/.test(ua);
};

/** 当前平台对应的搜索快捷键文案，如 "⌘K" / "Ctrl+K" */
export const searchHotkeyLabel = (): string => (isApplePlatform() ? '⌘K' : 'Ctrl+K');
