import { describe, it, expect } from 'vitest';
import { ExpenseCategory, ExpenseCategoryVO } from '../expense-category.vo.js';
import { ValidationError } from '../../../shared/validation-error.js';

describe('ExpenseCategoryVO', () => {
  it('should create valid expense categories', () => {
    const salary = ExpenseCategoryVO.create('SALARY');
    expect(salary).toBe(ExpenseCategory.SALARY);

    const rent = ExpenseCategoryVO.create('rent');
    expect(rent).toBe(ExpenseCategory.RENT);
  });

  it('should fail creation for invalid expense categories', () => {
    const result = ExpenseCategoryVO.createResult('ENTERTAINMENT');
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);

    expect(() => ExpenseCategoryVO.create('INVALID')).toThrow(ValidationError);
  });

  it('should verify equality contract', () => {
    const cat1 = ExpenseCategoryVO.create('UTILITIES');
    const cat2 = ExpenseCategoryVO.create('utilities');
    const cat3 = ExpenseCategoryVO.create('TAX');

    expect(ExpenseCategoryVO.equals(cat1, cat2)).toBe(true);
    expect(ExpenseCategoryVO.equals(cat1, cat3)).toBe(false);
  });
});
