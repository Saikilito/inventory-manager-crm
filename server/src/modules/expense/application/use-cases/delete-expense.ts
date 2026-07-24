import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError, createNotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IExpenseRepository } from '../repositories/expense.repository.js';
import { IExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { FinancialTransactionService } from '../../../financial/application/services/financial-transaction.service.js';

export type DeleteExpense = UseCase<string, void, DomainError>;

export const makeDeleteExpense = (
  expenseRepository: IExpenseRepository,
  financialTransactionService?: FinancialTransactionService,
): DeleteExpense => {
  return async (id: string) => {
    const composerResult = await ResultComposer.start()
      .useResult('existing', () => expenseRepository.getById(IdVO.create(id)))
      .useResult('validateExisting', ({ existing }) => {
        if (!existing) {
          return Result.fail(createNotFoundError('Expense not found'));
        }
        return Result.ok(existing);
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const existing = composerResult.getValue().validateExisting as IExpense;

    // Reverse financial transaction if expense had accountId
    if (financialTransactionService && existing.accountId) {
      await financialTransactionService.reverseExpense({
        expenseId: IdVO.create(id),
        amount: existing.amount,
        accountId: existing.accountId,
        financialDayId: IdVO.generateNil(),
      });
    }

    const deleteResult = await expenseRepository.deleteByIds([IdVO.create(id)], IdVO.generateNil());
    if (deleteResult.isFailure) {
      return Result.fail(deleteResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
