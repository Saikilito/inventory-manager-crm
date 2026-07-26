/* eslint-disable @typescript-eslint/no-explicit-any -- Mock repositories in tests require flexible typing for test isolation */
import { describe, it, expect } from 'vitest';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { SupportedCurrency } from '../../../../../../../shared-domain/src/shared/value-objects/currency.vo.js';

import { makeCreateAccount } from '../create-account.js';
import { makeCreateTransaction } from '../create-transaction.js';
import { makeOpenFinancialDay } from '../open-financial-day.js';
import { makeDeleteTransaction } from '../delete-transaction.js';
import {
  makeMockAccountRepository,
  makeMockTransactionRepository,
  makeMockFinancialDayRepository,
  makeMockDeliveryRepository,
  makeMockExpenseRepository,
} from './mocks/financial-mocks.js';

describe('Transaction Deletion with Expense Reference Cleanup (Bidirectional Sync)', () => {
  it('should clear expense accountId and transactionId when deleting EXPENSE transaction', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    const deliveryRepo = makeMockDeliveryRepository();
    const expenseRepo = makeMockExpenseRepository();

    const createAccount = makeCreateAccount(accountRepo as any);
    const openFinancialDay = makeOpenFinancialDay(financialDayRepo as any, accountRepo as any);
    const createTransaction = makeCreateTransaction(transactionRepo as any, accountRepo as any, financialDayRepo as any);
    const deleteTransaction = makeDeleteTransaction(
      transactionRepo as any,
      accountRepo as any,
      financialDayRepo as any,
      deliveryRepo as any,
      expenseRepo as any,
    );

    // Setup
    const acc = (await createAccount({ name: 'USD Box', currency: SupportedCurrency.USD, balance: 500 })).getValue();
    await openFinancialDay({ date: '2026-07-07' });

    // Create an expense with accountId and transactionId
    const expenseId = IdVO.generate().toString();
    await expenseRepo.create({
      id: expenseId,
      amount: 100,
      description: 'Test expense',
      category: 'UTILITIES',
      accountId: acc.id!.toString(),
      transactionId: 'txn-123',
    });

    // Create an EXPENSE transaction
    const tx = (await createTransaction({
      accountId: acc.id!.toString(),
      type: 'DEBIT',
      amount: 100,
      description: 'Expense payment',
      date: '2026-07-07',
      source: 'EXPENSE',
      sourceReferenceId: expenseId,
    })).getValue();

    // Delete the transaction
    const deleteRes = await deleteTransaction({ id: tx.id!.toString() });
    expect(deleteRes.isFailure).toBe(false);

    // Verify expense fields were cleared
    const expenseAfter = (await expenseRepo.getById(expenseId)).getValue();
    expect(expenseAfter).not.toBeNull();
    expect(expenseAfter.accountId).toBeUndefined();
    expect(expenseAfter.transactionId).toBeUndefined();
  });

  it('should clear expense fields when deleting EXPENSE_REVERSAL transaction', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    const deliveryRepo = makeMockDeliveryRepository();
    const expenseRepo = makeMockExpenseRepository();

    const createAccount = makeCreateAccount(accountRepo as any);
    const openFinancialDay = makeOpenFinancialDay(financialDayRepo as any, accountRepo as any);
    const createTransaction = makeCreateTransaction(transactionRepo as any, accountRepo as any, financialDayRepo as any);
    const deleteTransaction = makeDeleteTransaction(
      transactionRepo as any,
      accountRepo as any,
      financialDayRepo as any,
      deliveryRepo as any,
      expenseRepo as any,
    );

    // Setup
    const acc = (await createAccount({ name: 'USD Box', currency: SupportedCurrency.USD, balance: 500 })).getValue();
    await openFinancialDay({ date: '2026-07-07' });

    // Create an expense with accountId and transactionId
    const expenseId = IdVO.generate().toString();
    await expenseRepo.create({
      id: expenseId,
      amount: 100,
      description: 'Test expense',
      category: 'UTILITIES',
      accountId: acc.id!.toString(),
      transactionId: 'txn-456',
    });

    // Create an EXPENSE_REVERSAL transaction
    const tx = (await createTransaction({
      accountId: acc.id!.toString(),
      type: 'CREDIT',
      amount: 100,
      description: 'Expense reversal',
      date: '2026-07-07',
      source: 'EXPENSE_REVERSAL',
      sourceReferenceId: expenseId,
    })).getValue();

    // Delete the transaction
    const deleteRes = await deleteTransaction({ id: tx.id!.toString() });
    expect(deleteRes.isFailure).toBe(false);

    // Verify expense fields were cleared
    const expenseAfter = (await expenseRepo.getById(expenseId)).getValue();
    expect(expenseAfter).not.toBeNull();
    expect(expenseAfter.accountId).toBeUndefined();
    expect(expenseAfter.transactionId).toBeUndefined();
  });

  it('should NOT modify expense when deleting ORDER_PAYMENT transaction', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    const deliveryRepo = makeMockDeliveryRepository();
    const expenseRepo = makeMockExpenseRepository();

    const createAccount = makeCreateAccount(accountRepo as any);
    const openFinancialDay = makeOpenFinancialDay(financialDayRepo as any, accountRepo as any);
    const createTransaction = makeCreateTransaction(transactionRepo as any, accountRepo as any, financialDayRepo as any);
    const deleteTransaction = makeDeleteTransaction(
      transactionRepo as any,
      accountRepo as any,
      financialDayRepo as any,
      deliveryRepo as any,
      expenseRepo as any,
    );

    // Setup
    const acc = (await createAccount({ name: 'USD Box', currency: SupportedCurrency.USD, balance: 500 })).getValue();
    await openFinancialDay({ date: '2026-07-07' });

    // Create an expense
    const expenseId = IdVO.generate().toString();
    await expenseRepo.create({
      id: expenseId,
      amount: 100,
      description: 'Test expense',
      category: 'UTILITIES',
      accountId: acc.id!.toString(),
      transactionId: 'txn-789',
    });

    // Create an ORDER_PAYMENT transaction (not expense-related)
    const txRes = await createTransaction({
      accountId: acc.id!.toString(),
      type: 'CREDIT',
      amount: 200,
      description: 'Order payment',
      date: '2026-07-07',
      source: 'ORDER_PAYMENT',
      sourceReferenceId: IdVO.generate().toString(),
    });
    const tx = txRes.getValue();

    // Delete the transaction
    const deleteRes = await deleteTransaction({ id: tx.id!.toString() });
    expect(deleteRes.isFailure).toBe(false);

    // Verify expense was NOT modified
    const expenseAfter = (await expenseRepo.getById(expenseId)).getValue();
    expect(expenseAfter).not.toBeNull();
    expect(expenseAfter.accountId).toBeDefined();
    expect(expenseAfter.transactionId).toBeDefined();
  });

  it('should handle missing expense gracefully (no error)', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    const deliveryRepo = makeMockDeliveryRepository();
    const expenseRepo = makeMockExpenseRepository();

    const createAccount = makeCreateAccount(accountRepo as any);
    const openFinancialDay = makeOpenFinancialDay(financialDayRepo as any, accountRepo as any);
    const createTransaction = makeCreateTransaction(transactionRepo as any, accountRepo as any, financialDayRepo as any);
    const deleteTransaction = makeDeleteTransaction(
      transactionRepo as any,
      accountRepo as any,
      financialDayRepo as any,
      deliveryRepo as any,
      expenseRepo as any,
    );

    // Setup
    const acc = (await createAccount({ name: 'USD Box', currency: SupportedCurrency.USD, balance: 500 })).getValue();
    await openFinancialDay({ date: '2026-07-07' });

    // Create an EXPENSE transaction with non-existent expense reference
    const tx = (await createTransaction({
      accountId: acc.id!.toString(),
      type: 'DEBIT',
      amount: 100,
      description: 'Expense for missing expense',
      date: '2026-07-07',
      source: 'EXPENSE',
      sourceReferenceId: IdVO.generate().toString(),
    })).getValue();

    // Delete the transaction - should succeed despite missing expense
    const deleteRes = await deleteTransaction({ id: tx.id!.toString() });
    expect(deleteRes.isFailure).toBe(false);
    expect(deleteRes.getValue()).toBe(true);
  });

  it('should work without expenseRepository (backward compatibility)', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    const deliveryRepo = makeMockDeliveryRepository();
    // NO expenseRepository provided

    const createAccount = makeCreateAccount(accountRepo as any);
    const openFinancialDay = makeOpenFinancialDay(financialDayRepo as any, accountRepo as any);
    const createTransaction = makeCreateTransaction(transactionRepo as any, accountRepo as any, financialDayRepo as any);
    const deleteTransaction = makeDeleteTransaction(
      transactionRepo as any,
      accountRepo as any,
      financialDayRepo as any,
      deliveryRepo as any,
      // NO expenseRepository
    );

    // Setup
    const acc = (await createAccount({ name: 'USD Box', currency: SupportedCurrency.USD, balance: 500 })).getValue();
    await openFinancialDay({ date: '2026-07-07' });

    // Create an EXPENSE transaction
    const tx = (await createTransaction({
      accountId: acc.id!.toString(),
      type: 'DEBIT',
      amount: 100,
      description: 'Expense payment',
      date: '2026-07-07',
      source: 'EXPENSE',
      sourceReferenceId: IdVO.generate().toString(),
    })).getValue();

    // Delete the transaction - should succeed even without expenseRepository
    const deleteRes = await deleteTransaction({ id: tx.id!.toString() });
    expect(deleteRes.isFailure).toBe(false);
  });
});
