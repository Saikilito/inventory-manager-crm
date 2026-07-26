import { describe, it, expect } from 'vitest';
import { PaymentMethod, PaymentMethodVO } from '../payment-method.vo.js';
import { ValidationError } from '../../../shared/validation-error.js';

describe('PaymentMethodVO', () => {
  it('should create valid payment methods', () => {
    const cash = PaymentMethodVO.create('CASH');
    expect(cash).toBe(PaymentMethod.CASH);
    expect(PaymentMethodVO.isCash(cash)).toBe(true);

    const credit = PaymentMethodVO.create('credit');
    expect(credit).toBe(PaymentMethod.CREDIT);
    expect(PaymentMethodVO.isCredit(credit)).toBe(true);
  });

  it('should fail creation for invalid payment methods', () => {
    const result = PaymentMethodVO.createResult('BITCOIN');
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);

    expect(() => PaymentMethodVO.create('INVALID')).toThrow(ValidationError);
  });

  it('should check equality correctly', () => {
    const cash1 = PaymentMethodVO.create('CASH');
    const cash2 = PaymentMethodVO.create('cash');
    const credit = PaymentMethodVO.create('CREDIT');

    expect(PaymentMethodVO.equals(cash1, cash2)).toBe(true);
    expect(PaymentMethodVO.equals(cash1, credit)).toBe(false);
  });
});
