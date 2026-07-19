import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RentalCalculator } from '../rental-calculator.js';
import { DateTimeVO } from '../../shared/value-objects/date-time.vo.js';

describe('RentalCalculator', () => {
  let originalTz: string | undefined;

  beforeEach(() => {
    originalTz = process.env.TIMEZONE;
    process.env.TIMEZONE = 'America/Caracas'; // Use Venezuela/Caracas for consistent tests
  });

  afterEach(() => {
    if (originalTz === undefined) {
      delete process.env.TIMEZONE;
    } else {
      process.env.TIMEZONE = originalTz;
    }
  });

  it('should return end time on same day if duration does not exceed business hours', () => {
    // Monday at 10:00:00 (America/Caracas time is UTC-4, so 14:00 UTC)
    const start = DateTimeVO.create('2026-06-29T14:00:00Z'); // 10:00 AM Caracas
    expect(start).toBe('2026-06-29T10:00:00.000-04:00');

    // Rent for 4 hours
    const due = RentalCalculator.calculateRentalDueDate(start, 4);
    // Should end at Monday 14:00:00 Caracas
    expect(due).toBe('2026-06-29T14:00:00.000-04:00');
  });

  it('should adjust start time if it starts before business hours', () => {
    // Monday at 05:00:00 Caracas (09:00:00 UTC)
    const start = DateTimeVO.create('2026-06-29T09:00:00Z');
    expect(start).toBe('2026-06-29T05:00:00.000-04:00');

    // Rent for 2 hours. Start time adjusted to 08:00, plus 2 hours = 10:00
    const due = RentalCalculator.calculateRentalDueDate(start, 2);
    expect(due).toBe('2026-06-29T10:00:00.000-04:00');
  });

  it('should adjust start time if it starts after business hours', () => {
    // Monday at 20:00:00 Caracas (Tuesday 00:00:00 UTC)
    const start = DateTimeVO.create('2026-06-30T00:00:00Z');
    expect(start).toBe('2026-06-29T20:00:00.000-04:00');

    // Rent for 3 hours. Start adjusted to Tuesday 08:00, plus 3 hours = Tuesday 11:00
    const due = RentalCalculator.calculateRentalDueDate(start, 3);
    expect(due).toBe('2026-06-30T11:00:00.000-04:00');
  });

  it('should roll over to next day when duration exceeds closing time', () => {
    // Monday at 14:00:00 Caracas (18:00 UTC)
    const start = DateTimeVO.create('2026-06-29T18:00:00Z');
    // Rent for 6 hours. Remaining today: 4 hours. Rolls over 2 hours to Tuesday.
    // Tuesday 08:00 + 2 hours = Tuesday 10:00
    const due = RentalCalculator.calculateRentalDueDate(start, 6);
    expect(due).toBe('2026-06-30T10:00:00.000-04:00');
  });

  it('should skip weekends on rollover', () => {
    // Friday at 16:00:00 Caracas (20:00 UTC)
    const start = DateTimeVO.create('2026-06-26T20:00:00Z');
    // Rent for 5 hours. Remaining Friday: 2 hours. Rolls over 3 hours to Monday.
    // Monday 08:00 + 3 hours = Monday 11:00
    const due = RentalCalculator.calculateRentalDueDate(start, 5);
    expect(due).toBe('2026-06-29T11:00:00.000-04:00');
  });

  it('should adjust start time if starting on a weekend', () => {
    // Saturday at 12:00:00 Caracas (16:00 UTC)
    const start = DateTimeVO.create('2026-06-27T16:00:00Z');
    // Rent for 4 hours. Start adjusted to Monday 08:00 + 4 hours = Monday 12:00
    const due = RentalCalculator.calculateRentalDueDate(start, 4);
    expect(due).toBe('2026-06-29T12:00:00.000-04:00');
  });
});
