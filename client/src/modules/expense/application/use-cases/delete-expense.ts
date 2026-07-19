import { ExpenseRepository } from '../../domain/expense.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface DeleteExpenseUseCase {
  execute(id: Id): Promise<Result<boolean, DomainError>>;
}

export function makeDeleteExpenseUseCase(repository: ExpenseRepository): DeleteExpenseUseCase {
  return {
    execute: (id) => repository.delete(id),
  };
}
