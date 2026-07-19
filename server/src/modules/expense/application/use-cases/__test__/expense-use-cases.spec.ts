import { describe, it, expect } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { makeExpense, ExpenseCategory, ExpenseReferenceType, IExpense } from '../../../../../../../shared-domain/src/expense/expense.entity.js';
import { makeCreateExpense } from '../create-expense.js';
import { makeGetExpense } from '../get-expense.js';
import { makeGetAllExpenses } from '../get-all-expenses.js';
import { makeUpdateExpense } from '../update-expense.js';
import { makeDeleteExpense } from '../delete-expense.js';

const makeMockExpenseRepository = () => {
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
      const categoryField = input?.where?.fields?.find((f: any) => f.field.toString() === 'category');
      if (categoryField) {
        list = list.filter(e => e.category === categoryField.value);
      }
      const limit = input?.limit ? Number(input.limit) : 10;
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
      if (!existing) return Result.fail(new Error('Expense not found'));
      store.set(id.toString(), { ...existing, ...expense });
      return Result.ok(undefined);
    },

    async deleteByIds(ids: any[]): Promise<Result<void, any>> {
      for (const id of ids) {
        store.delete(id.toString());
      }
      return Result.ok(undefined);
    },

    async dissociateByContextId(contextId: any): Promise<Result<void, any>> {
      for (const [id, expense] of store.entries()) {
        if (expense.contextId?.toString() === contextId.toString()) {
          store.set(id, { ...expense, contextId: null });
        }
      }
      return Result.ok(undefined);
    }
  };
};

describe('Expense Use Cases', () => {
  it('should successfully create and fetch an expense', async () => {
    const repo = makeMockExpenseRepository();
    const createExpense = makeCreateExpense(repo as any);
    const getExpense = makeGetExpense(repo as any);

    const result = await createExpense({
      amount: 150.00,
      description: 'Office supplies',
      category: ExpenseCategory.REPLENISHMENT,
      contextId: '550e8400-e29b-41d4-a716-446655440022',
    });

    expect(result.isFailure).toBe(false);
    const created = result.getValue();
    expect(created.amount.toString()).toBe('150');
    expect(created.description.toString()).toBe('Office supplies');

    const getRes = await getExpense(created.id!.toString());
    expect(getRes.isFailure).toBe(false);
    expect(getRes.getValue().description.toString()).toBe('Office supplies');
  });

  it('should list and filter expenses', async () => {
    const repo = makeMockExpenseRepository();
    const createExpense = makeCreateExpense(repo as any);
    const getAllExpenses = makeGetAllExpenses(repo as any);

    await createExpense({
      amount: 150.00,
      description: 'Paper',
      category: ExpenseCategory.REPLENISHMENT,
      contextId: '550e8400-e29b-41d4-a716-446655440022',
    });

    await createExpense({
      amount: 450.00,
      description: 'Rent',
      category: ExpenseCategory.RENT,
    });

    const allRes = await getAllExpenses({});
    expect(allRes.isFailure).toBe(false);
    expect(allRes.getValue().total).toBe(2);

    const filteredContext = await getAllExpenses({ contextId: '550e8400-e29b-41d4-a716-446655440022' });
    expect(filteredContext.getValue().total).toBe(1);
    expect(filteredContext.getValue().items[0].description.toString()).toBe('Paper');

    const filteredCat = await getAllExpenses({ category: ExpenseCategory.RENT });
    expect(filteredCat.getValue().total).toBe(1);
    expect(filteredCat.getValue().items[0].description.toString()).toBe('Rent');
  });

  it('should update and delete an expense', async () => {
    const repo = makeMockExpenseRepository();
    const createExpense = makeCreateExpense(repo as any);
    const updateExpense = makeUpdateExpense(repo as any);
    const deleteExpense = makeDeleteExpense(repo as any);
    const getExpense = makeGetExpense(repo as any);

    const created = (await createExpense({
      amount: 100.00,
      description: 'Electricity',
      category: ExpenseCategory.UTILITIES,
    })).getValue();

    const updated = (await updateExpense({
      id: created.id!.toString(),
      amount: 120.00,
      description: 'Electricity updated',
    })).getValue();

    expect(updated.amount.toString()).toBe('120');
    expect(updated.description.toString()).toBe('Electricity updated');

    await deleteExpense(created.id!.toString());
    const deletedRes = await getExpense(created.id!.toString());
    expect(deletedRes.isFailure).toBe(true);
  });
});
