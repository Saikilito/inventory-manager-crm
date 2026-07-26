import { ExpenseRepository } from '../../domain/expense.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { makeExpense } from '@shared-domain/expense/expense.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface UpdateExpenseDto {
  id: string;
  amount: number;
  description: string;
  category: string;
  contextId?: string;
  referenceId?: string;
  referenceType?: string;
  accountId?: string;
}

export interface UpdateExpenseUseCase {
  execute(dto: UpdateExpenseDto): Promise<Result<boolean, DomainError>>;
}

export function makeUpdateExpenseUseCase(repository: ExpenseRepository): UpdateExpenseUseCase {
  return {
    execute: (dto) => repository.update(makeExpense(dto)),
  };
}
