import { ExpenseRepository } from '../../domain/expense.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { makeExpense } from '@shared-domain/expense/expense.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface CreateExpenseDto {
  amount: number;
  description: string;
  category: string;
  contextId?: string;
  referenceId?: string;
  referenceType?: string;
  accountId?: string;
}

export interface CreateExpenseUseCase {
  execute(dto: CreateExpenseDto): Promise<Result<boolean, DomainError>>;
}

export function makeCreateExpenseUseCase(repository: ExpenseRepository): CreateExpenseUseCase {
  return {
    execute: (dto) => repository.create(makeExpense(dto)),
  };
}
