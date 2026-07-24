/* eslint-disable @typescript-eslint/no-explicit-any -- Mock repositories in tests require flexible typing for test isolation */
import { describe, it, expect } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { FinancialDayStatus } from '../../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { SupportedCurrency } from '../../../../../../../shared-domain/src/shared/value-objects/currency.vo.js';
import { FinancialDayField } from '../../repositories/financial-day.constants.js';

import { makeCreateAccount } from '../create-account.js';
import { makeCreateTransaction } from '../create-transaction.js';
import { makeUpdateExchangeRate } from '../update-exchange-rate.js';
import { makeOpenFinancialDay } from '../open-financial-day.js';
import { makeCloseFinancialDay } from '../close-financial-day.js';
import { makeGetFinancialDayByDate } from '../get-financial-day.js';
import { makeDeleteTransaction } from '../delete-transaction.js';
import {
  makeMockAccountRepository,
  makeMockTransactionRepository,
  makeMockExchangeRateRepository,
  makeMockFinancialDayRepository,
  makeMockDeliveryRepository,
  makeMockOrderRepository,
  makeMockExpenseRepository,
} from './mocks/financial-mocks.js';

describe('Financial Use Cases', () => {
  it('should successfully create an account (CreateAccount)', async () => {
    const accountRepo = makeMockAccountRepository();
    const createAccount = makeCreateAccount(accountRepo as any);

    const result = await createAccount({ name: 'Cash USD', currency: SupportedCurrency.USD, balance: 100 });
    expect(result.isFailure).toBe(false);
    expect(result.getValue().balance).toBe(100);
    expect(accountRepo.getStore().size).toBe(1);
  });

  it('should open and close financial days with correct snapshot balances', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    const orderRepo = makeMockOrderRepository();
    const expenseRepo = makeMockExpenseRepository();

    const createAccount = makeCreateAccount(accountRepo as any);
    const openFinancialDay = makeOpenFinancialDay(financialDayRepo as any, accountRepo as any);
    const closeFinancialDay = makeCloseFinancialDay(
      financialDayRepo as any,
      accountRepo as any,
      transactionRepo as any,
      orderRepo as any,
      expenseRepo as any,
    );

    // Create accounts
    await createAccount({ name: 'Account 1', currency: SupportedCurrency.USD, balance: 50 });
    await createAccount({ name: 'Account 2', currency: SupportedCurrency.VES, balance: 1000 });

    // Open financial day
    const openRes = await openFinancialDay({ date: '2026-07-07' });
    expect(openRes.isFailure).toBe(false);
    const day = openRes.getValue();
    expect(day.status).toBe(FinancialDayStatus.OPEN);
    expect(day.openingBalances).toHaveLength(2);
    expect(day.openingBalances.find(b => b.balance === 50)).toBeDefined();

    // Close financial day
    // Modify one balance first
    const accounts = Array.from(accountRepo.getStore().values());
    await accountRepo.updateById(accounts[0].id!, { balance: 120 });

    const closeRes = await closeFinancialDay({ date: '2026-07-07' });
    expect(closeRes.isFailure).toBe(false);
    const closedDay = closeRes.getValue().financialDay;
    expect(closedDay.status).toBe(FinancialDayStatus.CLOSED);
    expect(closedDay.closingBalances.find(b => b.balance === 120)).toBeDefined();
  });

  it('should lazily create financial day if non-existent, and reject transactions if closed', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    const orderRepo = makeMockOrderRepository();
    const expenseRepo = makeMockExpenseRepository();

    const createAccount = makeCreateAccount(accountRepo as any);
    const createTransaction = makeCreateTransaction(transactionRepo as any, accountRepo as any, financialDayRepo as any);

    const acc = (await createAccount({ name: 'My Account', currency: SupportedCurrency.USD, balance: 200 })).getValue();

    // Try transaction without financial day - should succeed now because of lazy initialization!
    const successTx = await createTransaction({
      accountId: acc.id!.toString(),
      type: 'CREDIT',
      amount: 50,
      description: 'Test Out of Day',
      date: '2026-07-07',
    });
    expect(successTx.isFailure).toBe(false);
    expect(successTx.getValue().amount).toBe(50);

    // Verify financial day was created lazily
    const dayCheck = await financialDayRepo.getOne([
      { field: NonEmptyStringVO.create(FinancialDayField.Date), value: '2026-07-07', operator: '=' }
    ]);
    expect(dayCheck.isFailure).toBe(false);
    expect(dayCheck.getValue()).toBeDefined();

    // Set up a closed financial day (it's already open, so we just close it)
    const closeFinancialDay = makeCloseFinancialDay(
      financialDayRepo as any,
      accountRepo as any,
      transactionRepo as any,
      orderRepo as any,
      expenseRepo as any,
    );
    await closeFinancialDay({ date: '2026-07-07' });

    // Try transaction on closed day
    const failClosedTx = await createTransaction({
      accountId: acc.id!.toString(),
      type: 'CREDIT',
      amount: 50,
      description: 'Test Closed Day',
      date: '2026-07-07',
    });
    expect(failClosedTx.isFailure).toBe(true);
    expect(failClosedTx.getError().message).toContain('closed');
  });

  it('should successfully post a transaction and modify the account balance on open day', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();

    const createAccount = makeCreateAccount(accountRepo as any);
    const openFinancialDay = makeOpenFinancialDay(financialDayRepo as any, accountRepo as any);
    const createTransaction = makeCreateTransaction(transactionRepo as any, accountRepo as any, financialDayRepo as any);

    const acc = (await createAccount({ name: 'My Account', currency: SupportedCurrency.USD, balance: 200 })).getValue();
    await openFinancialDay({ date: '2026-07-07' });

    // Credit transaction (balance goes up)
    const txRes = await createTransaction({
      accountId: acc.id!.toString(),
      type: 'CREDIT',
      amount: 50,
      description: 'Sale Income',
      date: '2026-07-07',
    });
    expect(txRes.isFailure).toBe(false);
    expect(txRes.getValue().amount).toBe(50);

    const updatedAcc = (await accountRepo.getById(acc.id!)).getValue()!;
    expect(updatedAcc.balance).toBe(250);

    // Debit transaction (balance goes down)
    await createTransaction({
      accountId: acc.id!.toString(),
      type: 'DEBIT',
      amount: 30,
      description: 'Office Expense',
      date: '2026-07-07',
    });
    const finalAcc = (await accountRepo.getById(acc.id!)).getValue()!;
    expect(finalAcc.balance).toBe(220);
  });

  it('should update or create exchange rates and fall back recursively', async () => {
    const financialDayRepo = makeMockFinancialDayRepository();
    const exchangeRateRepo = makeMockExchangeRateRepository();

    const updateExchangeRate = makeUpdateExchangeRate(exchangeRateRepo as any);
    const getFinancialDayByDate = makeGetFinancialDayByDate(financialDayRepo as any, exchangeRateRepo as any);

    // Create rate on July 5
    await updateExchangeRate({ date: '2026-07-05', rate: 45.5 });

    // Look up July 7. July 7 is empty, July 6 is empty, falls back to July 5!
    const res = await getFinancialDayByDate({ date: '2026-07-07' });
    expect(res.isFailure).toBe(false);
    expect(res.getValue().exchangeRate).toBe(45.5);

    // Update July 7
    await updateExchangeRate({ date: '2026-07-07', rate: 46.2 });
    const resUpdated = await getFinancialDayByDate({ date: '2026-07-07' });
    expect(resUpdated.getValue().exchangeRate).toBe(46.2);
  });

  it('should handle deleteTransaction and correctly verify guards, balance reversions, and delivery cascade deletion', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    const deliveryRepo = makeMockDeliveryRepository();
    const orderRepo = makeMockOrderRepository();
    const expenseRepo = makeMockExpenseRepository();

    const createAccount = makeCreateAccount(accountRepo as any);
    const openFinancialDay = makeOpenFinancialDay(financialDayRepo as any, accountRepo as any);
    const createTransaction = makeCreateTransaction(transactionRepo as any, accountRepo as any, financialDayRepo as any);
    const deleteTransaction = makeDeleteTransaction(transactionRepo as any, accountRepo as any, financialDayRepo as any, deliveryRepo as any);

    // Setup account, day, and transactions
    const acc = (await createAccount({ name: 'USD Box', currency: SupportedCurrency.USD, balance: 500 })).getValue();
    const day = (await openFinancialDay({ date: '2026-07-07' })).getValue();

    // Create a CREDIT transaction and link to delivery
    const referenceId = IdVO.generate().toString();
    const creditTx = (await createTransaction({
      accountId: acc.id!.toString(),
      type: 'CREDIT',
      amount: 100,
      description: 'Credit Tx',
      date: '2026-07-07',
      sourceReferenceId: referenceId,
    })).getValue();

    // Setup an associated delivery
    await deliveryRepo.create({
      id: referenceId, // links by id
      orderId: referenceId, // links by orderId too
      scheduledDate: '2026-07-07',
      deliveryTime: '09:00',
      address: 'Test Address',
      status: 'PENDING',
    });

    // Verify balance went up first
    const accAfterCredit = (await accountRepo.getById(acc.id!)).getValue()!;
    expect(accAfterCredit.balance).toBe(600);

    // Create a DEBIT transaction
    const debitTx = (await createTransaction({
      accountId: acc.id!.toString(),
      type: 'DEBIT',
      amount: 50,
      description: 'Debit Tx',
      date: '2026-07-07',
    })).getValue();

    // Verify balance went down
    const accAfterDebit = (await accountRepo.getById(acc.id!)).getValue()!;
    expect(accAfterDebit.balance).toBe(550);

    // Test Deletion of DEBIT transaction -> balance should be reverted by adding amount (550 + 50 = 600)
    const deleteDebitRes = await deleteTransaction({ id: debitTx.id!.toString() });
    expect(deleteDebitRes.isFailure).toBe(false);
    expect(deleteDebitRes.getValue()).toBe(true);

    const accAfterDeleteDebit = (await accountRepo.getById(acc.id!)).getValue()!;
    expect(accAfterDeleteDebit.balance).toBe(600);

    // Test Deletion of CREDIT transaction -> balance should be reverted by subtracting amount (600 - 100 = 500)
    // AND associated delivery should be deleted
    const deleteCreditRes = await deleteTransaction({ id: creditTx.id!.toString() });
    expect(deleteCreditRes.isFailure).toBe(false);
    expect(deleteCreditRes.getValue()).toBe(true);

    const accAfterDeleteCredit = (await accountRepo.getById(acc.id!)).getValue()!;
    expect(accAfterDeleteCredit.balance).toBe(500);

    // Verify delivery cascade deletion
    const delCheck = await deliveryRepo.getById(IdVO.create(referenceId));
    expect(delCheck.getValue()).toBeNull();

    // Verify day-closure guard
    const closeFinancialDay = makeCloseFinancialDay(
      financialDayRepo as any,
      accountRepo as any,
      transactionRepo as any,
      orderRepo as any,
      expenseRepo as any,
    );
    await closeFinancialDay({ date: '2026-07-07' });

    // Try to delete a transaction on a closed day (create a mock transaction linked to closed day)
    const txOnClosedDay = (await transactionRepo.create({
      accountId: acc.id!.toString(),
      type: 'CREDIT',
      amount: 50,
      description: 'Closed day tx',
      date: '2026-07-07',
      financialDayId: day.id!.toString(),
    })).getValue();

    const deleteFailRes = await deleteTransaction({ id: txOnClosedDay.id!.toString() });
    expect(deleteFailRes.isFailure).toBe(true);
    expect(deleteFailRes.getError().message).toContain('closed');
  });
});
