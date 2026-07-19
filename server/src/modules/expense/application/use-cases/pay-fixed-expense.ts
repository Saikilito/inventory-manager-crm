import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { BillingMonthVO } from '../../../../../../shared-domain/src/shared/value-objects/billing-month.vo.js';
import { zodIdString, zodOptionalNullableIdString, zodPositiveNumber } from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import { makeFixedExpensePayment, IFixedExpensePayment } from '../../../../../../shared-domain/src/expense/fixed-expense.entity.js';
import { makeExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { IFixedExpenseRepository, IFixedExpensePaymentRepository } from '../repositories/fixed-expense.repository.js';
import { IExpenseRepository } from '../repositories/expense.repository.js';
import { CreateEntityInput } from '../../../../../../shared-domain/src/shared/repository.js';

export const PayFixedExpenseSchema = z.object({
  fixedExpenseId: zodIdString,
  billingMonth: z.string().refine((v) => BillingMonthVO.createResult(v).isSuccess, { message: 'Billing month must be in YYYY-MM format' }),
  amountPaid: zodPositiveNumber,
  contextId: zodOptionalNullableIdString,
});

export type PayFixedExpenseInput = z.infer<typeof PayFixedExpenseSchema>;

export type PayFixedExpense = UseCase<PayFixedExpenseInput, IFixedExpensePayment, DomainError>;

export const makePayFixedExpense = (
  fixedExpenseRepository: IFixedExpenseRepository,
  fixedExpensePaymentRepository: IFixedExpensePaymentRepository,
  expenseRepository: IExpenseRepository
): PayFixedExpense => {
  return async (input: PayFixedExpenseInput) => {
    const parseResult = PayFixedExpenseSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(new ValidationError(parseResult.error.message));
    }

    const fixedExpenseIdVO = IdVO.create(input.fixedExpenseId);

    const templateResult = await fixedExpenseRepository.getById(fixedExpenseIdVO);
    if (templateResult.isFailure) {
      return Result.fail(templateResult.getError());
    }
    const template = templateResult.getValue();
    if (!template) {
      return Result.fail(new NotFoundError('Fixed expense template not found'));
    }

    const existingPaymentResult = await fixedExpensePaymentRepository.getByMonthAndExpense(
      fixedExpenseIdVO,
      input.billingMonth
    );
    if (existingPaymentResult.isFailure) {
      return Result.fail(existingPaymentResult.getError());
    }
    const existingPayment = existingPaymentResult.getValue();
    if (existingPayment && existingPayment.isPaid) {
      return Result.fail(new DomainError('Fixed expense already paid for this month'));
    }

    const expenseDateStr = new Date().toISOString();
    const ledgerExpense = makeExpense({
      amount: input.amountPaid,
      description: `[Paid - ${input.billingMonth}] ${template.name.toString()}`,
      category: template.category,
      contextId: template.contextId ? template.contextId.toString() : (input.contextId || undefined),
      referenceId: template.id ? template.id.toString() : undefined,
      referenceType: 'FIXED_EXPENSE',
      createdAt: expenseDateStr,
      updatedAt: expenseDateStr,
    });

    const createLedgerResult = await expenseRepository.create(ledgerExpense as CreateEntityInput<IExpense>, IdVO.generateNil());
    if (createLedgerResult.isFailure) {
      return Result.fail(createLedgerResult.getError());
    }
    const createdLedgerExpense = createLedgerResult.getValue();

    const payment = makeFixedExpensePayment({
      fixedExpenseId: template.id!.toString(),
      billingMonth: input.billingMonth,
      isPaid: true,
      amountPaid: input.amountPaid,
      paidAt: new Date().toISOString(),
      generatedExpenseId: createdLedgerExpense.id.toString(),
      contextId: template.contextId ? template.contextId.toString() : (input.contextId || undefined),
    });

    const createPaymentResult = await fixedExpensePaymentRepository.create(payment as CreateEntityInput<IFixedExpensePayment>, IdVO.generateNil());
    if (createPaymentResult.isFailure) {
      // Manual rollback: delete standard Expense if payment registry fails
      await expenseRepository.deleteByIds([createdLedgerExpense.id], IdVO.generateNil());
      return Result.fail(createPaymentResult.getError());
    }

    return Result.ok<IFixedExpensePayment, DomainError>(createPaymentResult.getValue());
  };
};
