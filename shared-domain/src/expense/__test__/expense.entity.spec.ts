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

  it('should create an expense with valid referenceId and referenceType', () => {
    const expense = makeExpense({
      amount: 100,
      description: 'Product expense',
      category: 'UTILITIES',
      referenceId: '507f1f77bcf86cd799439011',
      referenceType: 'PRODUCT',
    });

    expect(expense.referenceId?.toString()).toBe('507f1f77bcf86cd799439011');
    expect(expense.referenceType).toBe('PRODUCT');
  });

  it('should throw validation error when referenceId is provided without referenceType', () => {
    expect(() =>
      makeExpense({
        amount: 100,
        description: 'Product expense',
        category: 'UTILITIES',
        referenceId: '507f1f77bcf86cd799439011',
      }),
    ).toThrow('Both referenceId and referenceType are required when referencing an entity');
  });

  it('should throw validation error when referenceType is provided without referenceId', () => {
    expect(() =>
      makeExpense({
        amount: 100,
        description: 'Product expense',
        category: 'UTILITIES',
        referenceType: 'PRODUCT',
      }),
    ).toThrow('Both referenceId and referenceType are required when referencing an entity');
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

  it('should return same expense when attaching the same transaction ID', () => {
    const txId = IdVO.create('507f1f77bcf86cd799439011');
    const expense = makeExpense({
      amount: 150.50,
      description: 'Office Supplies',
      category: 'UTILITIES',
      transactionId: '507f1f77bcf86cd799439011',
    });

    const updated = attachTransactionToExpense(expense, txId);
    expect(updated.transactionId?.toString()).toBe('507f1f77bcf86cd799439011');
  });

  it('should throw validation error when attaching a different transaction ID to an expense already attached', () => {
    const expense = makeExpense({
      amount: 150.50,
      description: 'Office Supplies',
      category: 'UTILITIES',
      transactionId: '507f1f77bcf86cd799439011',
    });

    const newTxId = IdVO.create('507f1f77bcf86cd799439099');
    expect(() => attachTransactionToExpense(expense, newTxId)).toThrow(
      'Expense is already attached to a transaction',
    );
  });
});
