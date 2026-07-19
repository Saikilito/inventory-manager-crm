import { ExpenseRepository } from '../../domain/expense.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IExpense } from '@shared-domain/expense/expense.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface CreateExpenseUseCase {
  execute(expense: IExpense): Promise<Result<boolean, DomainError>>;
}

export function makeCreateExpenseUseCase(repository: ExpenseRepository): CreateExpenseUseCase {
  return {
    execute: (expense) => repository.create(expense),
  };
}
