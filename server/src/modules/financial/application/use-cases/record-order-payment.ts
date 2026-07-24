import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { PositiveNumber } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { ITransaction } from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { IOrderPayment } from '../../../../../../shared-domain/src/order/order.entity.js';
import { FinancialTransactionService } from '../services/financial-transaction.service.js';
import { IFinancialDayRepository } from '../repositories/financial.repository.js';
import { makeFindOrOpenFinancialDay } from '../services/find-or-open-financial-day.js';
import { IAccountRepository } from '../repositories/financial.repository.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';

export interface RecordOrderPaymentInput {
  orderId: string;
  payments: IOrderPayment[];
  date?: string;
}

export type RecordOrderPaymentUseCase = UseCase<RecordOrderPaymentInput, ITransaction[], DomainError>;

export const makeRecordOrderPaymentUseCase = (
  financialTransactionService: FinancialTransactionService,
  financialDayRepository: IFinancialDayRepository,
  accountRepository: IAccountRepository,
): RecordOrderPaymentUseCase => {
  const findOrOpenFinancialDay = makeFindOrOpenFinancialDay(
    financialDayRepository,
    accountRepository,
  );

  return async (input: RecordOrderPaymentInput) => {
    const dateStr = DateOnlyVO.create(input.date ?? new Date().toISOString());

    const dayResult = await findOrOpenFinancialDay(dateStr.toString());
    if (dayResult.isFailure) {
      return Result.fail(dayResult.getError());
    }

    const financialDay = dayResult.getValue();

    const paymentsMapped = input.payments.map((p) => ({
      accountId: p.accountId,
      amount: p.amount,
      exchangeRate: p.exchangeRate,
    }));

    const result = await financialTransactionService.recordOrderPayment({
      orderId: IdVO.create(input.orderId),
      payments: paymentsMapped,
      financialDayId: financialDay.id!,
    });

    if (result.isFailure) {
      return Result.fail(result.getError());
    }

    return Result.ok<ITransaction[], DomainError>(result.getValue());
  };
};
