import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DateOnlyVO } from '../date-only.vo.js';
import { ValidationError } from '../../validation-error.js';

describe('DateOnlyVO', () => {
  it('should format current/supplied date to YYYY-MM-DD in America/Caracas by default', () => {
    // '2026-06-30T03:00:00Z' is 2026-06-29T23:00:00 in America/Caracas (-04:00)
    const res = DateOnlyVO.createResult('2026-06-30T03:00:00Z');
    expect(res.isFailure).toBe(false);
    expect(res.getValue()).toBe('2026-06-29');
  });

  it('should support explicit YYYY-MM-DD strings and validate them', () => {
    const res = DateOnlyVO.createResult('2026-12-31');
    expect(res.isFailure).toBe(false);
    expect(res.getValue()).toBe('2026-12-31');

    const invalid = DateOnlyVO.createResult('2026-02-30'); // February doesn't have 30 days
    expect(invalid.isFailure).toBe(true);
    expect(invalid.getError()).toBeInstanceOf(ValidationError);
  });

  it('should parse correctly in other timezones when injected', () => {
    const res = DateOnlyVO.createResult('2026-06-30T03:00:00Z', 'UTC');
    expect(res.isFailure).toBe(false);
    expect(res.getValue()).toBe('2026-06-30');
  });
});
