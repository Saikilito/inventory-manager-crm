import { Result } from '@shared-domain/shared/result.js';
import { IExpense } from '@shared-domain/expense/expense.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';
import { PositiveNumber } from '@shared-domain/shared/value-objects/positive-number.vo.js';
import { NonNegativeNumber } from '@shared-domain/shared/value-objects/non-negative-number.vo.js';

export interface GetExpensesResult {
  items: IExpense[];
  total: number;
}

export interface ExpenseRepository {
  getAll(
    limit?: PositiveNumber,
    offset?: NonNegativeNumber,
    contextId?: Id,
    category?: string
  ): Promise<Result<GetExpensesResult, DomainError>>;
  getById(id: Id): Promise<Result<IExpense | null, DomainError>>;
  create(expense: IExpense): Promise<Result<boolean, DomainError>>;
  update(expense: IExpense): Promise<Result<boolean, DomainError>>;
  delete(id: Id): Promise<Result<boolean, DomainError>>;
}
