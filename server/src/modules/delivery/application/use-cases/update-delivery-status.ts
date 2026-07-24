import { match } from "ts-pattern";
import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { createValidationError } from "../../../../../../shared-domain/src/shared/validation-error.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { DeliveryStatusVO } from "../../../../../../shared-domain/src/shared/value-objects/delivery-status.vo.js";
import {
  IDelivery,
  DeliveryStatus,
} from "../../../../../../shared-domain/src/delivery/delivery.entity.js";
import {
  DeliveryStatus as OrderDeliveryStatus,
  OrderStatus,
} from "../../../../../../shared-domain/src/order/order.entity.js";
import { IDeliveryRepository } from "../repositories/delivery.repository.js";
import { IOrderRepository } from "../../../order/application/repositories/order.repository.js";
import { RecordDeliveryPaymentUseCase } from "../../../financial/application/use-cases/record-delivery-payment.js";

export interface UpdateDeliveryStatusInput {
  id: string;
  status: string;
}

const parseDeliveryStatus = (status: string): DeliveryStatus | null => {
  const result = DeliveryStatusVO.createResult(status);
  return result.isFailure ? null : (result.getValue() as DeliveryStatus);
};

const mapDeliveryToOrderStatuses = (status: DeliveryStatus): {
  deliveryStatus: OrderDeliveryStatus;
  orderStatus: OrderStatus;
} => match(status)
  .with(DeliveryStatus.CANCELLED, DeliveryStatus.PENDING, () => ({
    deliveryStatus: OrderDeliveryStatus.PENDING,
    orderStatus: OrderStatus.ACTIVE,
  }))
  .with(DeliveryStatus.DISPATCHED, () => ({
    deliveryStatus: OrderDeliveryStatus.SENT,
    orderStatus: OrderStatus.ACTIVE,
  }))
  .with(DeliveryStatus.DELIVERED, () => ({
    deliveryStatus: OrderDeliveryStatus.COMPLETE,
    orderStatus: OrderStatus.ACTIVE,
  }))
  .exhaustive();

export type UpdateDeliveryStatus = UseCase<
  UpdateDeliveryStatusInput,
  IDelivery,
  DomainError
>;

export const makeUpdateDeliveryStatus = (
  deliveryRepository: IDeliveryRepository,
  orderRepository: IOrderRepository,
  recordDeliveryPayment: RecordDeliveryPaymentUseCase,
): UpdateDeliveryStatus => {
  return async (input: UpdateDeliveryStatusInput) => {
    const status = parseDeliveryStatus(input.status);

    if (!status) {
      return Result.fail(
        createValidationError(`Invalid delivery status: ${input.status}`),
      );
    }

    const idResult = IdVO.createResult(input.id);
    if (idResult.isFailure) {
      return Result.fail(
        createValidationError(`Invalid delivery ID format: ${input.id}`),
      );
    }

    const updateResult = await deliveryRepository.updateById(
      idResult.getValue(),
      { status },
      IdVO.generateNil(),
    );
    if (updateResult.isFailure) {
      return Result.fail(updateResult.getError());
    }

    const fetchedResult = await deliveryRepository.getById(idResult.getValue());
    if (fetchedResult.isFailure) {
      return Result.fail(fetchedResult.getError());
    }
    const fetched = fetchedResult.getValue();
    if (!fetched) {
      return Result.fail(createValidationError(`Delivery with id ${input.id} not found after update`));
    }

    const orderId = fetched.orderId;
    const orderResult = await orderRepository.getById(orderId);
    if (!orderResult.isFailure) {
      const order = orderResult.getValue();
      if (order) {
        const targetStatuses = mapDeliveryToOrderStatuses(status);
        const needsDeliveryStatusUpdate = order.deliveryStatus !== targetStatuses.deliveryStatus;

        if (needsDeliveryStatusUpdate) {
          const syncOrderResult = await orderRepository.updateById(
            orderId,
            { deliveryStatus: targetStatuses.deliveryStatus },
            IdVO.generateNil()
          );
          if (syncOrderResult.isFailure) {
            return Result.fail(syncOrderResult.getError());
          }
        }

        if (status === DeliveryStatus.DELIVERED && fetched.id) {
          await recordDeliveryPayment({
            deliveryId: fetched.id.toString(),
            orderId: orderId.toString(),
          });
        }
      }
    }

    return Result.ok(fetched);
  };
};
