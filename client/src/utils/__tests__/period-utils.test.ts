import { describe, it, expect } from 'vitest';
import { toStartOfDayISO, toEndOfDayISO, toDateOnlyString } from '../period-utils';

describe('period-utils date helpers', () => {
  it('converts date string to start of day ISO string', () => {
    const iso = toStartOfDayISO('2026-07-26');
    const expectedTime = new Date('2026-07-26T00:00:00').getTime();
    expect(new Date(iso).getTime()).toBe(expectedTime);
  });

  it('converts date string to end of day ISO string', () => {
    const iso = toEndOfDayISO('2026-07-26');
    const expectedTime = new Date('2026-07-26T23:59:59.999').getTime();
    expect(new Date(iso).getTime()).toBe(expectedTime);
  });

  it('handles empty date string in ISO converters', () => {
    expect(toStartOfDayISO('')).toBe('');
    expect(toEndOfDayISO('')).toBe('');
  });

  it('extracts YYYY-MM-DD from datetime strings', () => {
    expect(toDateOnlyString('2026-07-26T15:30:00.000Z')).toBe('2026-07-26');
    expect(toDateOnlyString('2026-07-26')).toBe('2026-07-26');
    expect(toDateOnlyString('')).toBe('');
  });
});
