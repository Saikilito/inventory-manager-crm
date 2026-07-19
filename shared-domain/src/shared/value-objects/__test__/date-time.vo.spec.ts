import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DateTimeVO } from '../date-time.vo.js';
import { ValidationError } from '../../validation-error.js';

describe('DateTimeVO', () => {
  it('should successfully create date-time with default timezone (America/Caracas)', () => {
    // '2026-06-30T12:00:00Z' is 2026-06-30T08:00:00.000-04:00 in America/Caracas
    const res = DateTimeVO.createResult('2026-06-30T12:00:00Z');
    expect(res.isFailure).toBe(false);
    expect(res.getValue()).toBe('2026-06-30T08:00:00.000-04:00');
  });

  it('should handle different timezones like UTC when injected', () => {
    const res = DateTimeVO.createResult('2026-06-30T12:00:00Z', 'UTC');
    expect(res.isFailure).toBe(false);
    expect(res.getValue()).toBe('2026-06-30T12:00:00.000+00:00');
  });

  it('should handle timezones with positive offset (e.g. Europe/Madrid, summer time DST) when injected', () => {
    const res = DateTimeVO.createResult('2026-06-30T12:00:00Z', 'Europe/Madrid'); // UTC+2 in June
    expect(res.isFailure).toBe(false);
    expect(res.getValue()).toBe('2026-06-30T14:00:00.000+02:00');
  });

  it('should handle invalid date input', () => {
    const res = DateTimeVO.createResult('not-a-date');
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toBeInstanceOf(ValidationError);
  });

  it('should throw an error on create if invalid', () => {
    expect(() => DateTimeVO.create('not-a-date')).toThrow(ValidationError);
  });

  it('should format current date if no input provided', () => {
    const res = DateTimeVO.createResult();
    expect(res.isFailure).toBe(false);
    expect(res.getValue()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/);
  });
});
