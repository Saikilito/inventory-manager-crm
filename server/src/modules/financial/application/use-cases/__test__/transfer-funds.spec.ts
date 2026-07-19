import { describe, it, expect } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../../shared-domain/src/shared/validation-error.js';
import { IAccount, makeAccount } from '../../../../../../../shared-domain/src/financial/account.entity.js';
import { ITransaction, makeTransaction, TransactionType } from '../../../../../../../shared-domain/src/financial/transaction.entity.js';
import { IFinancialDay, makeFinancialDay, FinancialDayStatus } from '../../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { SupportedCurrency } from '../../../../../../../shared-domain/src/shared/value-objects/currency.vo.js';
import { makeTransferFunds } from '../transfer-funds.js';
import { makeCreateAccount } from '../create-account.js';

const makeMockAccountRepository = () => {
  const store = new Map<string, IAccount>();
  return {
    getStore() { return store; },
    async getById(id: any) { return Result.ok(store.get(id.toString()) || null); },
    async create(account: any) {
      const id = account.id || IdVO.generate();
      const saved = { ...account, id };
      store.set(id.toString(), saved);
      return Result.ok(saved);
    },
    async getAll() { return Result.ok({ items: Array.from(store.values()), total: store.size }); },
    async updateById(id: any, account: any) {
      const existing = store.get(id.toString());
      if (!existing) return Result.fail(new DatabaseError('Account not found'));
      store.set(id.toString(), { ...existing, ...account });
      return Result.ok();
    }
  };
};

const makeMockTransactionRepository = () => {
  const store = new Map<string, ITransaction>();
  return {
    getStore() { return store; },
    async create(tx: any) {
      const id = tx.id || IdVO.generate();
      const saved = { ...tx, id };
      store.set(id.toString(), saved);
      return Result.ok(saved);
    }
  };
};

const makeMockFinancialDayRepository = (withOpenDay: boolean = true) => {
  const store = new Map<string, IFinancialDay>();
  return {
    getStore() { return store; },
    async getOne(where: any) {
      const dateField = where.find((f: any) => f.field.toString() === 'date');
      if (dateField) {
        return Result.ok(store.get(dateField.value) || null);
      }
      return Result.ok(null);
    },
    async create(day: any) {
      const id = day.id || IdVO.generate();
      const saved = { ...day, id };
      store.set(day.date.toString(), saved);
      return Result.ok(saved);
    },
    async updateById(id: any, day: any) {
      const existing = Array.from(store.values()).find(d => d.id!.toString() === id.toString());
      if (!existing) return Result.fail(new DatabaseError('Financial day not found'));
      store.set(existing.date.toString(), { ...existing, ...day });
      return Result.ok();
    },
    seedOpenDay(date: string) {
      const day = makeFinancialDay({
        id: IdVO.generate().toString(),
        date,
        status: FinancialDayStatus.OPEN,
        openedAt: new Date().toISOString(),
      });
      store.set(date, day);
      return day;
    },
    seedClosedDay(date: string) {
      const day = makeFinancialDay({
        id: IdVO.generate().toString(),
        date,
        status: FinancialDayStatus.CLOSED,
        openedAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
      });
      store.set(date, day);
      return day;
    }
  };
};

describe('Transfer Funds Use Case', () => {
  it('should successfully transfer between same currency accounts (1:1)', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    financialDayRepo.seedOpenDay('2026-07-09');

    const createAccount = makeCreateAccount(accountRepo as any);
    const transferFunds = makeTransferFunds(transactionRepo as any, accountRepo as any, financialDayRepo as any);

    const sourceAcc = (await createAccount({ name: 'Cash USD 1', currency: SupportedCurrency.USD, balance: 500 })).getValue();
    const targetAcc = (await createAccount({ name: 'Cash USD 2', currency: SupportedCurrency.USD, balance: 100 })).getValue();

    const result = await transferFunds({
      sourceAccountId: sourceAcc.id!.toString(),
      targetAccountId: targetAcc.id!.toString(),
      amount: 150,
      description: 'Internal transfer',
      date: '2026-07-09'
    });

    expect(result.isFailure).toBe(false);
    const output = result.getValue();

    expect(output.sourceTransaction.type).toBe(TransactionType.DEBIT);
    expect(output.sourceTransaction.amount).toBe(150);
    expect(output.sourceTransaction.currency.toString()).toBe(SupportedCurrency.USD);
    expect(output.sourceTransaction.referenceId?.toString()).toBeDefined();

    expect(output.targetTransaction.type).toBe(TransactionType.CREDIT);
    expect(output.targetTransaction.amount).toBe(150);
    expect(output.targetTransaction.currency.toString()).toBe(SupportedCurrency.USD);
    expect(output.targetTransaction.referenceId?.toString()).toBe(output.sourceTransaction.referenceId?.toString());

    const updatedSource = (await accountRepo.getById(sourceAcc.id!)).getValue()!;
    const updatedTarget = (await accountRepo.getById(targetAcc.id!)).getValue()!;

    expect(updatedSource.balance).toBe(350);
    expect(updatedTarget.balance).toBe(250);
  });

  it('should transfer between multi-currency accounts using exchangeRate', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    financialDayRepo.seedOpenDay('2026-07-09');

    const createAccount = makeCreateAccount(accountRepo as any);
    const transferFunds = makeTransferFunds(transactionRepo as any, accountRepo as any, financialDayRepo as any);

    const sourceAcc = (await createAccount({ name: 'Main USD', currency: SupportedCurrency.USD, balance: 100 })).getValue();
    const targetAcc = (await createAccount({ name: 'Bank VES', currency: SupportedCurrency.VES, balance: 0 })).getValue();

    const result = await transferFunds({
      sourceAccountId: sourceAcc.id!.toString(),
      targetAccountId: targetAcc.id!.toString(),
      amount: 10,
      exchangeRate: 45.0,
      date: '2026-07-09'
    });

    expect(result.isFailure).toBe(false);
    const output = result.getValue();

    expect(output.sourceTransaction.amount).toBe(10);
    expect(output.targetTransaction.amount).toBe(450);

    const updatedSource = (await accountRepo.getById(sourceAcc.id!)).getValue()!;
    const updatedTarget = (await accountRepo.getById(targetAcc.id!)).getValue()!;

    expect(updatedSource.balance).toBe(90);
    expect(updatedTarget.balance).toBe(450);
  });

  it('should reject when transferring to the same account', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    financialDayRepo.seedOpenDay('2026-07-09');

    const createAccount = makeCreateAccount(accountRepo as any);
    const transferFunds = makeTransferFunds(transactionRepo as any, accountRepo as any, financialDayRepo as any);

    const sourceAcc = (await createAccount({ name: 'Cash USD', currency: SupportedCurrency.USD, balance: 500 })).getValue();

    const result = await transferFunds({
      sourceAccountId: sourceAcc.id!.toString(),
      targetAccountId: sourceAcc.id!.toString(),
      amount: 100,
      date: '2026-07-09'
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);
    expect(result.getError().message).toContain('same account');
  });

  it('should reject when source account has insufficient funds', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    financialDayRepo.seedOpenDay('2026-07-09');

    const createAccount = makeCreateAccount(accountRepo as any);
    const transferFunds = makeTransferFunds(transactionRepo as any, accountRepo as any, financialDayRepo as any);

    const sourceAcc = (await createAccount({ name: 'Cash USD 1', currency: SupportedCurrency.USD, balance: 50 })).getValue();
    const targetAcc = (await createAccount({ name: 'Cash USD 2', currency: SupportedCurrency.USD, balance: 100 })).getValue();

    const result = await transferFunds({
      sourceAccountId: sourceAcc.id!.toString(),
      targetAccountId: targetAcc.id!.toString(),
      amount: 100,
      date: '2026-07-09'
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);
    expect(result.getError().message).toContain('Insufficient funds');
  });

  it('should reject when no financial day exists for the date', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();

    const createAccount = makeCreateAccount(accountRepo as any);
    const transferFunds = makeTransferFunds(transactionRepo as any, accountRepo as any, financialDayRepo as any);

    const sourceAcc = (await createAccount({ name: 'Cash USD', currency: SupportedCurrency.USD, balance: 500 })).getValue();
    const targetAcc = (await createAccount({ name: 'Bank USD', currency: SupportedCurrency.USD, balance: 100 })).getValue();

    const result = await transferFunds({
      sourceAccountId: sourceAcc.id!.toString(),
      targetAccountId: targetAcc.id!.toString(),
      amount: 50,
      date: '2026-07-09'
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);
    expect(result.getError().message).toContain('No financial day');
  });

  it('should reject when financial day is closed', async () => {
    const accountRepo = makeMockAccountRepository();
    const transactionRepo = makeMockTransactionRepository();
    const financialDayRepo = makeMockFinancialDayRepository();
    financialDayRepo.seedClosedDay('2026-07-09');

    const createAccount = makeCreateAccount(accountRepo as any);
    const transferFunds = makeTransferFunds(transactionRepo as any, accountRepo as any, financialDayRepo as any);

    const sourceAcc = (await createAccount({ name: 'Cash USD', currency: SupportedCurrency.USD, balance: 500 })).getValue();
    const targetAcc = (await createAccount({ name: 'Bank USD', currency: SupportedCurrency.USD, balance: 100 })).getValue();

    const result = await transferFunds({
      sourceAccountId: sourceAcc.id!.toString(),
      targetAccountId: targetAcc.id!.toString(),
      amount: 50,
      date: '2026-07-09'
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);
    expect(result.getError().message).toContain('closed');
  });
});
