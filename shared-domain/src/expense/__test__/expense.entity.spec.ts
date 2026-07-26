import { describe, it, expect } from 'vitest';
import { makeExpense, attachTransactionToExpense } from '../expense.entity.js';
import { IdVO } from '../../shared/value-objects/id.vo.js';

describe('Expense Entity', () => {
  it('should create an expense with valid properties', () => {
    const expense = makeExpense({
      amount: 150.50,
      description: 'Office Supplies',
      category: 'UTILITIES',
    });

    expect(Number(expense.amount)).toBe(150.50);
    expect(expense.description.toString()).toBe('Office Supplies');
    expect(expense.category).toBe('UTILITIES');
  });

  it('should attach transaction ID to expense via domain transition method', () => {
    const expense = makeExpense({
      amount: 150.50,
      description: 'Office Supplies',
      category: 'UTILITIES',
    });

    const txId = IdVO.create('507f1f77bcf86cd799439011');
    const updated = attachTransactionToExpense(expense, txId);

    expect(updated.transactionId?.toString()).toBe('507f1f77bcf86cd799439011');
    expect(Number(updated.amount)).toBe(150.50);
    expect(updated.description.toString()).toBe('Office Supplies');
  });
});
