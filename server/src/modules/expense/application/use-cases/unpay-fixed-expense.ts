import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createNotFoundError, createValidationError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { zodIdString, zodBillingMonth } from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import { IFixedExpensePaymentRepository } from '../repositories/fixed-expense.repository.js';
import { IExpenseRepository } from '../repositories/expense.repository.js';

export const UnpayFixedExpenseSchema = z.object({
  fixedExpenseId: zodIdString,
  billingMonth: zodBillingMonth,
});

export type UnpayFixedExpenseInput = z.infer<typeof UnpayFixedExpenseSchema>;

export type UnpayFixedExpense = UseCase<UnpayFixedExpenseInput, boolean, DomainError>;

export const makeUnpayFixedExpense = (
  fixedExpensePaymentRepository: IFixedExpensePaymentRepository,
  expenseRepository: IExpenseRepository
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
      const deleteExpenseResult = await expenseRepository.deleteByIds(
        [payment.generatedExpenseId],
        IdVO.generateNil()
      );
      if (deleteExpenseResult.isFailure) {
        return Result.fail(deleteExpenseResult.getError());
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
