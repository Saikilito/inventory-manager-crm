import { ExpenseRepository } from '../../domain/expense.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IExpense } from '@shared-domain/expense/expense.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface UpdateExpenseUseCase {
  execute(expense: IExpense): Promise<Result<boolean, DomainError>>;
}

export function makeUpdateExpenseUseCase(repository: ExpenseRepository): UpdateExpenseUseCase {
  return {
    execute: (expense) => repository.update(expense),
  };
}
