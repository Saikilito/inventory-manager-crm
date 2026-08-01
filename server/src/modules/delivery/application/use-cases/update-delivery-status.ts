import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { createValidationError } from "../../../../../../shared-domain/src/shared/validation-error.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { DateTimeVO } from "../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js";
import { DeliveryStatusVO } from "../../../../../../shared-domain/src/shared/value-objects/delivery-status.vo.js";
import { IDelivery } from "../../../../../../shared-domain/src/delivery/delivery.entity.js";
import { DeliveryStatus } from "../../../../../../shared-domain/src/delivery/delivery-status.js";
import { resolveOrderStatus } from "../../../../../../shared-domain/src/order/order-status.rules.js";
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

    const updateData: Partial<IDelivery> = { status };
    if (status === DeliveryStatus.SENT) {
      updateData.deliveryTime = DateTimeVO.toFormattedTime();
    }

    const updateResult = await deliveryRepository.updateById(
      idResult.getValue(),
      updateData,
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
        const nextOrderStatus = resolveOrderStatus({
          requestedStatus: order.status,
          paymentStatus: order.paymentStatus,
          deliveryStatus: status,
        });

        if (nextOrderStatus !== order.status) {
          const syncOrderResult = await orderRepository.updateById(
            orderId,
            { status: nextOrderStatus },
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
