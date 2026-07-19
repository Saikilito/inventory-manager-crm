import { ExpenseRepository, GetExpensesResult } from '../../domain/expense.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';
import { PositiveNumber } from '@shared-domain/shared/value-objects/positive-number.vo.js';
import { NonNegativeNumber } from '@shared-domain/shared/value-objects/non-negative-number.vo.js';

export interface GetExpensesUseCase {
  execute(
    limit?: PositiveNumber,
    offset?: NonNegativeNumber,
    contextId?: Id,
    category?: string
  ): Promise<Result<GetExpensesResult, DomainError>>;
}

export function makeGetExpensesUseCase(repository: ExpenseRepository): GetExpensesUseCase {
  return {
    execute: (limit, offset, contextId, category) =>
      repository.getAll(limit, offset, contextId, category),
  };
}
