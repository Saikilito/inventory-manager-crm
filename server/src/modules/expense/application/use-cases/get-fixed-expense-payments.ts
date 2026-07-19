import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { BillingMonthVO } from '../../../../../../shared-domain/src/shared/value-objects/billing-month.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { WhereField } from '../../../../../../shared-domain/src/shared/repository.js';
import { IFixedExpense, IFixedExpensePayment } from '../../../../../../shared-domain/src/expense/fixed-expense.entity.js';
import { IFixedExpenseRepository, IFixedExpensePaymentRepository } from '../repositories/fixed-expense.repository.js';

export const GetFixedExpensePaymentsSchema = z.object({
  billingMonth: z.string().refine((v) => BillingMonthVO.createResult(v).isSuccess, { message: 'Billing month must be in YYYY-MM format' }),
  contextId: z.string().optional().nullable(),
});

export type GetFixedExpensePaymentsInput = z.infer<typeof GetFixedExpensePaymentsSchema>;

export interface FixedExpenseChecklistItem {
  fixedExpense: IFixedExpense;
  payment: IFixedExpensePayment | null;
}

export type GetFixedExpensePayments = UseCase<GetFixedExpensePaymentsInput, FixedExpenseChecklistItem[], DomainError>;

export const makeGetFixedExpensePayments = (
  fixedExpenseRepository: IFixedExpenseRepository,
  fixedExpensePaymentRepository: IFixedExpensePaymentRepository
): GetFixedExpensePayments => {
  return async (input: GetFixedExpensePaymentsInput) => {
    const parseResult = GetFixedExpensePaymentsSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(new ValidationError(parseResult.error.message));
    }

    const fields: WhereField[] = [];
    if (input.contextId) {
      fields.push({
        field: NonEmptyStringVO.create('contextId'),
        value: input.contextId,
        operator: '=',
      });
    }

    const templatesResult = await fixedExpenseRepository.getAll({
      limit: PositiveNumberVO.create(250),
      page: PositiveNumberVO.create(1),
      where: { fields },
    });

    if (templatesResult.isFailure) {
      return Result.fail(templatesResult.getError());
    }

    const templates = templatesResult.getValue().items;

    const paymentFields: WhereField[] = [
      {
        field: NonEmptyStringVO.create('billingMonth'),
        value: input.billingMonth,
        operator: '=',
      }
    ];
    if (input.contextId) {
      paymentFields.push({
        field: NonEmptyStringVO.create('contextId'),
        value: input.contextId,
        operator: '=',
      });
    }

    const paymentsResult = await fixedExpensePaymentRepository.getAll({
      limit: PositiveNumberVO.create(250),
      page: PositiveNumberVO.create(1),
      where: { fields: paymentFields },
    });

    if (paymentsResult.isFailure) {
      return Result.fail(paymentsResult.getError());
    }

    const payments = paymentsResult.getValue().items;

    const checklist: FixedExpenseChecklistItem[] = [];

    for (const template of templates) {
      const payment = payments.find(p => p.fixedExpenseId.toString() === template.id?.toString()) || null;

      if (template.isActive || (payment && payment.isPaid)) {
        checklist.push({
          fixedExpense: template,
          payment,
        });
      }
    }

    return Result.ok<FixedExpenseChecklistItem[], DomainError>(checklist);
  };
};
