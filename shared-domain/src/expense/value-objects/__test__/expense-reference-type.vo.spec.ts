import { describe, it, expect } from 'vitest';
import { ExpenseReferenceType, ExpenseReferenceTypeVO } from '../expense-reference-type.vo.js';
import { ValidationError } from '../../../shared/validation-error.js';

describe('ExpenseReferenceTypeVO', () => {
  it('should create valid expense reference types', () => {
    const product = ExpenseReferenceTypeVO.create('PRODUCT');
    expect(product).toBe(ExpenseReferenceType.PRODUCT);

    const seller = ExpenseReferenceTypeVO.create('seller');
    expect(seller).toBe(ExpenseReferenceType.SELLER);
  });

  it('should fail creation for invalid reference types', () => {
    const result = ExpenseReferenceTypeVO.createResult('CLIENT');
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);

    expect(() => ExpenseReferenceTypeVO.create('INVALID')).toThrow(ValidationError);
  });

  it('should verify equality contract', () => {
    const ref1 = ExpenseReferenceTypeVO.create('FIXED_EXPENSE');
    const ref2 = ExpenseReferenceTypeVO.create('fixed_expense');
    const ref3 = ExpenseReferenceTypeVO.create('PRODUCT');

    expect(ExpenseReferenceTypeVO.equals(ref1, ref2)).toBe(true);
    expect(ExpenseReferenceTypeVO.equals(ref1, ref3)).toBe(false);
  });
});
