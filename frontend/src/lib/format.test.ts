import { describe, expect, it } from 'vitest';
import {
  countdown,
  formatArea,
  formatNumber,
  initials,
  titleCase,
  truncate,
} from './format';

describe('countdown', () => {
  const now = new Date('2026-10-26T12:00:00.000Z');

  it('formats minutes, hours and days until the deadline', () => {
    expect(countdown('2026-10-26T12:25:00.000Z', now)).toMatchObject({
      text: 'Vence en 25 min',
      overdue: false,
      urgent: true,
    });

    expect(countdown('2026-10-26T14:00:00.000Z', now)).toMatchObject({
      text: 'Vence en 2 h',
      overdue: false,
      urgent: true,
    });

    expect(countdown('2026-10-30T12:00:00.000Z', now)).toMatchObject({
      text: 'Vence en 4 d',
      overdue: false,
      urgent: false,
    });
  });

  it('marks overdue deadlines and does not treat them as urgent', () => {
    expect(countdown('2026-10-26T10:00:00.000Z', now)).toMatchObject({
      text: 'Vencida hace 2 h',
      overdue: true,
      urgent: false,
      milliseconds: -7_200_000,
    });
  });

  it('keeps the raw millisecond difference for sorting and display', () => {
    const result = countdown('2026-10-26T12:01:00.000Z', now);
    expect(result.milliseconds).toBe(60_000);
  });
});

describe('formatting helpers', () => {
  it('formats numbers with Spanish separators', () => {
    expect(formatNumber(12.5)).toBe('12,5');
    expect(formatArea(12.5)).toBe('12,5 ha');
  });

  it('normalizes short display strings', () => {
    expect(titleCase('olivos')).toBe('Olivos');
    expect(titleCase('')).toBe('');
    expect(initials('Marta Ruiz')).toBe('MR');
    expect(initials('  Ana  de la Vega ')).toBe('AD');
    expect(truncate('abcdef', 4)).toBe('abc…');
    expect(truncate('abc', 4)).toBe('abc');
  });
});
