import { describe, it, expect } from 'vitest';
import { TransactionSource, TransactionSourceVO, isTransactionSource } from '../transaction-source.vo.js';
import { ValidationError } from '../../shared/validation-error.js';

describe('TransactionSourceVO', () => {
  it('should create valid transaction sources', () => {
    const vo = TransactionSourceVO.create('ORDER_PAYMENT');
    expect(vo).toBe(TransactionSource.ORDER_PAYMENT);

    const lowercaseVo = TransactionSourceVO.create('expense');
    expect(lowercaseVo).toBe(TransactionSource.EXPENSE);
  });

  it('should fail creation for invalid sources', () => {
    const result = TransactionSourceVO.createResult('INVALID_SOURCE');
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);

    expect(() => TransactionSourceVO.create('INVALID')).toThrow(ValidationError);
  });

  it('should verify equality contract', () => {
    const vo1 = TransactionSourceVO.create('EXPENSE');
    const vo2 = TransactionSourceVO.create('expense');
    const vo3 = TransactionSourceVO.create('TRANSFER');

    expect(TransactionSourceVO.equals(vo1, vo2)).toBe(true);
    expect(TransactionSourceVO.equals(vo1, vo3)).toBe(false);
  });

  it('should validate via isTransactionSource guard', () => {
    expect(isTransactionSource('ORDER_PAYMENT')).toBe(true);
    expect(isTransactionSource('invalid')).toBe(false);
  });
});
