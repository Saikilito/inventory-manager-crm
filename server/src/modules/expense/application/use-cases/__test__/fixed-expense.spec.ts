import { describe, it, expect } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { ExpenseCategory } from '../../../../../../../shared-domain/src/expense/expense.entity.js';
import { makeCreateFixedExpense } from '../create-fixed-expense.js';
import { makeUpdateFixedExpense } from '../update-fixed-expense.js';
import { makeDeleteFixedExpense } from '../delete-fixed-expense.js';
import { makeGetAllFixedExpenses } from '../get-all-fixed-expenses.js';
import { makePayFixedExpense } from '../pay-fixed-expense.js';
import { makeUnpayFixedExpense } from '../unpay-fixed-expense.js';
import { makeGetFixedExpensePayments } from '../get-fixed-expense-payments.js';

const makeMockFixedExpenseRepository = () => {
  const store = new Map<string, any>();

  return {
    async getById(id: any): Promise<Result<any, any>> {
      return Result.ok(store.get(id.toString()) || null);
    },

    async getAll(input?: any): Promise<Result<any, any>> {
      let list = Array.from(store.values());
      const contextField = input?.where?.fields?.find((f: any) => f.field.toString() === 'contextId');
      if (contextField) {
        list = list.filter(e => e.contextId?.toString() === contextField.value);
      }
      const limit = input?.limit ? Number(input.limit) : 250;
      const page = input?.page ? Number(input.page) : 1;
      const skip = (page - 1) * limit;
      const items = list.slice(skip, skip + limit);
      const total = list.length;
      return Result.ok({ items, total, page, limit, pages: Math.ceil(total / limit) });
    },

    async create(expense: any): Promise<Result<any, any>> {
      const id = expense.id || IdVO.generate();
      const saved = { ...expense, id };
      store.set(id.toString(), saved);
      return Result.ok(saved);
    },

    async updateById(id: any, expense: any): Promise<Result<void, any>> {
      const existing = store.get(id.toString());
      if (!existing) return Result.fail(new Error('Fixed expense not found'));
      store.set(id.toString(), { ...existing, ...expense });
      return Result.ok(undefined);
    },

    async deleteByIds(ids: any[]): Promise<Result<void, any>> {
      for (const id of ids) {
        store.delete(id.toString());
      }
      return Result.ok(undefined);
    }
  };
};

const makeMockFixedExpensePaymentRepository = () => {
  const store = new Map<string, any>();

  return {
    async getByMonthAndExpense(fixedExpenseId: any, billingMonth: string): Promise<Result<any, any>> {
      const payments = Array.from(store.values());
      const payment = payments.find(p => p.fixedExpenseId.toString() === fixedExpenseId.toString() && p.billingMonth === billingMonth);
      return Result.ok(payment || null);
    },

    async getAll(input?: any): Promise<Result<any, any>> {
      let list = Array.from(store.values());
      const monthField = input?.where?.fields?.find((f: any) => f.field.toString() === 'billingMonth');
      if (monthField) {
        list = list.filter(p => p.billingMonth === monthField.value);
      }
      const contextField = input?.where?.fields?.find((f: any) => f.field.toString() === 'contextId');
      if (contextField) {
        list = list.filter(p => p.contextId?.toString() === contextField.value);
      }
      const limit = input?.limit ? Number(input.limit) : 250;
      const page = input?.page ? Number(input.page) : 1;
      const skip = (page - 1) * limit;
      const items = list.slice(skip, skip + limit);
      const total = list.length;
      return Result.ok({ items, total, page, limit, pages: Math.ceil(total / limit) });
    },

    async create(payment: any): Promise<Result<any, any>> {
      const id = payment.id || IdVO.generate();
      const saved = { ...payment, id };
      store.set(id.toString(), saved);
      return Result.ok(saved);
    },

    async deleteByIds(ids: any[]): Promise<Result<void, any>> {
      for (const id of ids) {
        store.delete(id.toString());
      }
      return Result.ok(undefined);
    }
  };
};

const makeMockExpenseRepository = () => {
  const store = new Map<string, any>();

  return {
    async create(expense: any): Promise<Result<any, any>> {
      const id = expense.id || IdVO.generate();
      const saved = { ...expense, id };
      store.set(id.toString(), saved);
      return Result.ok(saved);
    },

    async deleteByIds(ids: any[]): Promise<Result<void, any>> {
      for (const id of ids) {
        store.delete(id.toString());
      }
      return Result.ok(undefined);
    },

    getStore() {
      return store;
    }
  };
};

describe('Fixed Expense Use Cases', () => {
  it('should successfully CRUD fixed expense templates', async () => {
    const fixedRepo = makeMockFixedExpenseRepository();
    const createUseCase = makeCreateFixedExpense(fixedRepo as any);
    const updateUseCase = makeUpdateFixedExpense(fixedRepo as any);
    const deleteUseCase = makeDeleteFixedExpense(fixedRepo as any);
    const getAllUseCase = makeGetAllFixedExpenses(fixedRepo as any);

    const templateResult = await createUseCase({
      name: 'Vercel Server',
      category: ExpenseCategory.UTILITIES,
      amount: 150.00,
      contextId: '550e8400-e29b-41d4-a716-446655440022'
    });

    expect(templateResult.isFailure).toBe(false);
    const template = templateResult.getValue();
    expect(template.name.toString()).toBe('Vercel Server');
    expect(template.amount).toBe(150);

    const updateResult = await updateUseCase({
      id: template.id!.toString(),
      amount: 180.00,
      isActive: false
    });
    expect(updateResult.isFailure).toBe(false);
    expect(updateResult.getValue().amount).toBe(180);
    expect(updateResult.getValue().isActive).toBe(false);

    const listResult = await getAllUseCase({ contextId: '550e8400-e29b-41d4-a716-446655440022' });
    expect(listResult.isFailure).toBe(false);
    expect(listResult.getValue().length).toBe(1);

    await deleteUseCase(template.id!.toString());
    const listResultAfterDelete = await getAllUseCase({ contextId: '550e8400-e29b-41d4-a716-446655440022' });
    expect(listResultAfterDelete.getValue().length).toBe(0);
  });

  it('should synchronize standard ledger expenses on pay and delete on unpay (Option A Double-Entry Sync)', async () => {
    const fixedRepo = makeMockFixedExpenseRepository();
    const paymentRepo = makeMockFixedExpensePaymentRepository();
    const expenseRepo = makeMockExpenseRepository();

    const mockDeleteExpenseUseCase = async (id: string) => {
      await expenseRepo.deleteByIds([id]);
      return Result.ok(true);
    };

    const createUseCase = makeCreateFixedExpense(fixedRepo as any);
    const payUseCase = makePayFixedExpense(fixedRepo as any, paymentRepo as any, expenseRepo as any);
    const unpayUseCase = makeUnpayFixedExpense(paymentRepo as any, mockDeleteExpenseUseCase as any);
    const checklistUseCase = makeGetFixedExpensePayments(fixedRepo as any, paymentRepo as any);

    // 1. Create active fixed expense template
    const template = (await createUseCase({
      name: 'Vercel Pro',
      category: ExpenseCategory.UTILITIES,
      amount: 200.00,
      contextId: '550e8400-e29b-41d4-a716-446655440022'
    })).getValue();

    // 2. Pay the fixed expense for July 2026
    const payResult = await payUseCase({
      fixedExpenseId: template.id!.toString(),
      billingMonth: '2026-07',
      amountPaid: 200.00,
      contextId: '550e8400-e29b-41d4-a716-446655440022'
    });

    expect(payResult.isFailure).toBe(false);
    const payment = payResult.getValue();
    expect(payment.isPaid).toBe(true);
    expect(payment.generatedExpenseId).toBeDefined();

    // Verify ledger expense was created with Option A sync
    const ledgerStore = expenseRepo.getStore();
    expect(ledgerStore.size).toBe(1);
    const ledgerExpense = ledgerStore.get(payment.generatedExpenseId!.toString());
    expect(ledgerExpense).toBeDefined();
    expect(ledgerExpense.amount).toBe(200);
    expect(ledgerExpense.description).toBe('Vercel Pro');
    expect(ledgerExpense.referenceType).toBe('FIXED_EXPENSE');
    expect(ledgerExpense.createdAt).toBeDefined();
    expect(typeof ledgerExpense.createdAt.toString()).toBe('string');

    // 3. Verify checklist retrieval
    const checklistResult = await checklistUseCase({
      billingMonth: '2026-07',
      contextId: '550e8400-e29b-41d4-a716-446655440022'
    });
    expect(checklistResult.isFailure).toBe(false);
    expect(checklistResult.getValue().length).toBe(1);
    expect(checklistResult.getValue()[0].payment?.isPaid).toBe(true);

    // 4. Unpay the fixed expense
    const unpayResult = await unpayUseCase({
      fixedExpenseId: template.id!.toString(),
      billingMonth: '2026-07'
    });
    expect(unpayResult.isFailure).toBe(false);
    expect(unpayResult.getValue()).toBe(true);

    // Verify ledger expense was removed on unpay
    expect(ledgerStore.size).toBe(0);

    // Verify checklist item is now unpaid (or payment record removed)
    const checklistAfterUnpay = await checklistUseCase({
      billingMonth: '2026-07',
      contextId: '550e8400-e29b-41d4-a716-446655440022'
    });
    expect(checklistAfterUnpay.getValue()[0].payment).toBeNull();
  });
});
