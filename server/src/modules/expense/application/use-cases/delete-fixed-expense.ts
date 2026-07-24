import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createNotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IFixedExpenseRepository } from '../repositories/fixed-expense.repository.js';

export type DeleteFixedExpense = UseCase<string, void, DomainError>;

export const makeDeleteFixedExpense = (fixedExpenseRepository: IFixedExpenseRepository): DeleteFixedExpense => {
  return async (id: string) => {
    const composerResult = await ResultComposer.start()
      .useResult('existing', () => fixedExpenseRepository.getById(IdVO.create(id)))
      .useResult('validateExisting', ({ existing }) => {
        if (!existing) {
          return Result.fail(createNotFoundError('Fixed expense template not found'));
        }
        return Result.ok();
      })
      .useResult('delete', () => fixedExpenseRepository.deleteByIds([IdVO.create(id)], IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
