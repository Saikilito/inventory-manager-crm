import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createNotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IExpenseRepository } from '../repositories/expense.repository.js';
import { IFixedExpensePaymentRepository } from '../repositories/fixed-expense.repository.js';
import { IExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { IFixedExpensePayment } from '../../../../../../shared-domain/src/expense/fixed-expense.entity.js';
import { ReverseExpenseUseCase } from '../../../financial/application/use-cases/reverse-expense.js';

export type DeleteExpense = UseCase<string, void, DomainError>;

export const makeDeleteExpense = (
  expenseRepository: IExpenseRepository,
  reverseExpense?: ReverseExpenseUseCase,
  fixedExpensePaymentRepository?: IFixedExpensePaymentRepository,
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
    if (reverseExpense && existing.accountId) {
      const reversalResult = await reverseExpense({
        expenseId: id,
        amount: Number(existing.amount),
        accountId: existing.accountId.toString(),
        description: `Expense reversal - ${existing.description.toString()}`,
      });
      if (reversalResult.isFailure) {
        return Result.fail(reversalResult.getError());
      }
    }

    // Cascade delete fixed expense payment if it exists
    if (fixedExpensePaymentRepository && existing.referenceType === 'FIXED_EXPENSE') {
      const paymentResult = await fixedExpensePaymentRepository.getOne([
        { field: NonEmptyStringVO.create('generatedExpenseId'), value: id, operator: '=' }
      ]);
      if (!paymentResult.isFailure && paymentResult.getValue()) {
        const payment = paymentResult.getValue() as IFixedExpensePayment;
        await fixedExpensePaymentRepository.deleteByIds([payment.id!], IdVO.generateNil());
      }
    }

    const deleteResult = await expenseRepository.deleteByIds([IdVO.create(id)], IdVO.generateNil());
    if (deleteResult.isFailure) {
      return Result.fail(deleteResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
