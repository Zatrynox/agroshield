import { describe, expect, it } from 'vitest';
import { safeRedirect } from './redirect';

describe('safeRedirect', () => {
  it('keeps panel destinations, including nested paths and queries', () => {
    expect(safeRedirect('/panel')).toBe('/panel');
    expect(safeRedirect('/panel/alertas')).toBe('/panel/alertas');
    expect(safeRedirect('/panel/zonas/abc?tab=salud')).toBe('/panel/zonas/abc?tab=salud');
  });

  it('falls back for external, protocol-relative or unrelated values', () => {
    expect(safeRedirect('https://evil.example/panel')).toBe('/panel');
    expect(safeRedirect('//evil.example/panel')).toBe('/panel');
    expect(safeRedirect('/login')).toBe('/panel');
    expect(safeRedirect('javascript:alert(1)')).toBe('/panel');
    expect(safeRedirect(undefined)).toBe('/panel');
    expect(safeRedirect(42)).toBe('/panel');
  });
});
