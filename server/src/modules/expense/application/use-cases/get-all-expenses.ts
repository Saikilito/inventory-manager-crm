import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { WhereField } from '../../../../../../shared-domain/src/shared/repository.js';
import { IExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { IExpenseRepository } from '../repositories/expense.repository.js';

export interface GetAllExpensesInput {
  limit?: number;
  offset?: number;
  contextId?: string;
  category?: string;
}

export interface PaginatedExpenses {
  items: IExpense[];
  total: number;
}

export type GetAllExpenses = UseCase<GetAllExpensesInput, PaginatedExpenses, DomainError>;

export const makeGetAllExpenses = (expenseRepository: IExpenseRepository): GetAllExpenses => {
  return async (input: GetAllExpensesInput) => {
    const limitNum = input.limit ?? 10;
    const offsetNum = input.offset ?? 0;
    const pageNum = Math.floor(offsetNum / limitNum) + 1;

    const composerResult = await ResultComposer.start()
      .useResult('expensesResult', () => {
        const fields: WhereField[] = [];
        if (input.contextId) {
          fields.push({
            field: NonEmptyStringVO.create('contextId'),
            value: input.contextId,
            operator: '=',
          });
        }
        if (input.category) {
          fields.push({
            field: NonEmptyStringVO.create('category'),
            value: input.category,
            operator: '=',
          });
        }

        return expenseRepository.getAll({
          limit: PositiveNumberVO.create(limitNum),
          page: PositiveNumberVO.create(pageNum),
          where: { fields },
          sort: { field: 'createdAt', direction: 'DESC' }
        });
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { expensesResult } = composerResult.getValue();

    return Result.ok<PaginatedExpenses, DomainError>({
      items: expensesResult.items,
      total: expensesResult.total,
    });
  };
};
