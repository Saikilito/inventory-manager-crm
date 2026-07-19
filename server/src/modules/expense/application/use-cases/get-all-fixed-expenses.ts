import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { WhereField } from '../../../../../../shared-domain/src/shared/repository.js';
import { IFixedExpense } from '../../../../../../shared-domain/src/expense/fixed-expense.entity.js';
import { IFixedExpenseRepository } from '../repositories/fixed-expense.repository.js';

export interface GetAllFixedExpensesInput {
  contextId?: string;
}

export type GetAllFixedExpenses = UseCase<GetAllFixedExpensesInput, IFixedExpense[], DomainError>;

export const makeGetAllFixedExpenses = (fixedExpenseRepository: IFixedExpenseRepository): GetAllFixedExpenses => {
  return async (input: GetAllFixedExpensesInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('templatesResult', () => {
        const fields: WhereField[] = [];
        if (input.contextId) {
          fields.push({
            field: NonEmptyStringVO.create('contextId'),
            value: input.contextId,
            operator: '=',
          });
        }

        return fixedExpenseRepository.getAll({
          limit: PositiveNumberVO.create(250),
          page: PositiveNumberVO.create(1),
          where: { fields },
          sort: { field: 'name', direction: 'ASC' }
        });
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { templatesResult } = composerResult.getValue();

    return Result.ok<IFixedExpense[], DomainError>(templatesResult.items);
  };
};
