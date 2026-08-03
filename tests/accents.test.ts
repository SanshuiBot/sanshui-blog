import { describe, it, expect } from 'vitest';
import { hexToRgb, rgbToHex, getPreset, DEFAULT_ACCENT_ID } from '@/lib/accents';

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
