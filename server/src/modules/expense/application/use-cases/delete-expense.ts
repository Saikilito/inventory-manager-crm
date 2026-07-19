import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IExpenseRepository } from '../repositories/expense.repository.js';

export type DeleteExpense = UseCase<string, void, DomainError>;

export const makeDeleteExpense = (expenseRepository: IExpenseRepository): DeleteExpense => {
  return async (id: string) => {
    const composerResult = await ResultComposer.start()
      .useResult('existing', () => expenseRepository.getById(IdVO.create(id)))
      .useResult('validateExisting', ({ existing }) => {
        if (!existing) {
          return Result.fail(new NotFoundError('Expense not found'));
        }
        return Result.ok();
      })
      .useResult('delete', () => expenseRepository.deleteByIds([IdVO.create(id)], IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
