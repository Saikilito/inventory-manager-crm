import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { ITransaction } from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { PaymentStatus } from '../../../../../../shared-domain/src/order/order.entity.js';
import { FinancialTransactionService } from '../services/financial-transaction.service.js';
import { IFinancialDayRepository } from '../repositories/financial.repository.js';
import { IAccountRepository } from '../repositories/financial.repository.js';
import { IOrderRepository } from '../../../order/application/repositories/order.repository.js';
import { makeFindOrOpenFinancialDay } from '../services/find-or-open-financial-day.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';

export interface RecordDeliveryPaymentInput {
  deliveryId: string;
  orderId: string;
}

export type RecordDeliveryPaymentUseCase = UseCase<RecordDeliveryPaymentInput, ITransaction | null, DomainError>;

export const makeRecordDeliveryPaymentUseCase = (
  financialTransactionService: FinancialTransactionService,
  financialDayRepository: IFinancialDayRepository,
  accountRepository: IAccountRepository,
  orderRepository: IOrderRepository,
): RecordDeliveryPaymentUseCase => {
  const findOrOpenFinancialDay = makeFindOrOpenFinancialDay(
    financialDayRepository,
    accountRepository,
  );

  return async (input: RecordDeliveryPaymentInput) => {
    const orderResult = await orderRepository.getById(IdVO.create(input.orderId));
    if (orderResult.isFailure) {
      return Result.ok(null);
    }

    const order = orderResult.getValue();
    if (!order) {
      return Result.ok(null);
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      return Result.ok(null);
    }

    if (!order.payments || order.payments.length === 0) {
      return Result.ok(null);
    }

    const deliveryCost = order.deliveryCost as number | undefined;
    if (!deliveryCost || deliveryCost <= 0) {
      return Result.ok(null);
    }

    const firstPayment = order.payments[0];
    const accountId = firstPayment.accountId;

    const dateStr = DateOnlyVO.create(new Date().toISOString());
    const dayResult = await findOrOpenFinancialDay(dateStr.toString());
    if (dayResult.isFailure) {
      return Result.fail(dayResult.getError());
    }

    const financialDay = dayResult.getValue();
    const amountVO = PositiveNumberVO.create(deliveryCost);

    const result = await financialTransactionService.recordDeliveryPayment({
      deliveryId: IdVO.create(input.deliveryId),
      orderId: IdVO.create(input.orderId),
      accountId,
      amount: amountVO,
      financialDayId: financialDay.id!,
    });

    if (result.isFailure) {
      return Result.fail(result.getError());
    }

    return Result.ok<ITransaction | null, DomainError>(result.getValue());
  };
};
