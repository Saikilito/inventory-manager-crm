import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createNotFoundError, createValidationError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { zodIdString, zodBillingMonth } from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import { IFixedExpensePaymentRepository } from '../repositories/fixed-expense.repository.js';
import { DeleteExpense } from './delete-expense.js';

export const UnpayFixedExpenseSchema = z.object({
  fixedExpenseId: zodIdString,
  billingMonth: zodBillingMonth,
});

export type UnpayFixedExpenseInput = z.infer<typeof UnpayFixedExpenseSchema>;

export type UnpayFixedExpense = UseCase<UnpayFixedExpenseInput, boolean, DomainError>;

export const makeUnpayFixedExpense = (
  fixedExpensePaymentRepository: IFixedExpensePaymentRepository,
  deleteExpenseUseCase: DeleteExpense
): UnpayFixedExpense => {
  return async (input: UnpayFixedExpenseInput) => {
    const parseResult = UnpayFixedExpenseSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(createValidationError(parseResult.error.message));
    }

    const fixedExpenseIdVO = IdVO.create(input.fixedExpenseId);

    const paymentResult = await fixedExpensePaymentRepository.getByMonthAndExpense(
      fixedExpenseIdVO,
      input.billingMonth
    );
    if (paymentResult.isFailure) {
      return Result.fail(paymentResult.getError());
    }
    const payment = paymentResult.getValue();
    if (!payment) {
      return Result.fail(createNotFoundError('Payment registry not found for this month'));
    }

    if (payment.generatedExpenseId) {
      // Use the deleteExpense UseCase to ensure financial transactions are reversed
      const deleteExpenseResult = await deleteExpenseUseCase(payment.generatedExpenseId.toString());
      if (deleteExpenseResult.isFailure) {
        const error = deleteExpenseResult.getError();
        // If the expense is already gone, don't block the unpay action. It was likely deleted directly from the general ledger.
        if (error.name !== 'NotFoundError') {
          return Result.fail(error);
        }
        console.warn(`Expense ${payment.generatedExpenseId} already deleted or not found. Proceeding to delete payment registry.`);
      }
    }

    const deletePaymentResult = await fixedExpensePaymentRepository.deleteByIds(
      [payment.id!],
      IdVO.generateNil()
    );
    if (deletePaymentResult.isFailure) {
      return Result.fail(deletePaymentResult.getError());
    }

    return Result.ok<boolean, DomainError>(true);
  };
};
