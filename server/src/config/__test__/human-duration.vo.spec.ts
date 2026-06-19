import { describe, it, expect } from 'vitest';
import { HumanDurationVO } from '../../../../shared-domain/src/shared/value-objects/human-duration.vo.js';

describe('HumanDurationVO', () => {
  it('should successfully parse valid duration strings into milliseconds', () => {
    // 30 seconds
    const sResult = HumanDurationVO.createResult('30s');
    expect(sResult.isFailure).toBe(false);
    expect(sResult.getValue()).toBe(30 * 1000);

    // 15 minutes
    const mResult = HumanDurationVO.createResult('15m');
    expect(mResult.isFailure).toBe(false);
    expect(mResult.getValue()).toBe(15 * 60 * 1000);

    // 2 hours
    const hResult = HumanDurationVO.createResult('2h');
    expect(hResult.isFailure).toBe(false);
    expect(hResult.getValue()).toBe(2 * 60 * 60 * 1000);

    // 1 day
    const dResult = HumanDurationVO.createResult('1d');
    expect(dResult.isFailure).toBe(false);
    expect(dResult.getValue()).toBe(24 * 60 * 60 * 1000);
  });

  it('should handle case insensitivity and whitespace', () => {
    const mixedCaseResult = HumanDurationVO.createResult(' 15M ');
    expect(mixedCaseResult.isFailure).toBe(false);
    expect(mixedCaseResult.getValue()).toBe(15 * 60 * 1000);
  });

  it('should fail for invalid formats', () => {
    const invalidFormat = HumanDurationVO.createResult('15');
    expect(invalidFormat.isFailure).toBe(true);
    expect(invalidFormat.getError().message).toContain('Invalid duration format');

    const invalidUnit = HumanDurationVO.createResult('15x');
    expect(invalidUnit.isFailure).toBe(true);
    expect(invalidUnit.getError().message).toContain('Invalid duration format');

    const negativeValue = HumanDurationVO.createResult('-5m');
    expect(negativeValue.isFailure).toBe(true);
  });

  it('should throw an error on create if invalid', () => {
    expect(() => HumanDurationVO.create('15x')).toThrow();
  });

  it('should successfully create a valid duration with create method', () => {
    const duration = HumanDurationVO.create('15m');
    expect(duration).toBe(15 * 60 * 1000);
  });
});
