import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { IExpenseRepository } from '../repositories/expense.repository.js';

export type GetExpense = UseCase<string, IExpense, DomainError>;

export const makeGetExpense = (expenseRepository: IExpenseRepository): GetExpense => {
  return async (id: string) => {
    const composerResult = await ResultComposer.start()
      .useResult('expense', () => expenseRepository.getById(IdVO.create(id)))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const expense = composerResult.getValue().expense;
    if (!expense) {
      return Result.fail(new NotFoundError('Expense not found'));
    }

    return Result.ok(expense);
  };
};
