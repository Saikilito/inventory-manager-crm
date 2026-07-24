import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import {
  IDelivery,
  makeDelivery,
  DeliveryStatus,
} from "../../../../../../shared-domain/src/delivery/delivery.entity.js";
import { IDeliveryRepository } from "../repositories/delivery.repository.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { DateTimeVO } from "../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js";

export interface ScheduleDeliveryInput {
  orderId: string;
  scheduledDate: string;
  deliveryTime: string;
  address: string;
  notes?: string;
}

export type ScheduleDelivery = UseCase<
  ScheduleDeliveryInput,
  IDelivery,
  DomainError
>;

export const makeScheduleDelivery = (
  deliveryRepository: IDeliveryRepository,
): ScheduleDelivery => {
  return async (input: ScheduleDeliveryInput) => {
    const orderIdResult = IdVO.createResult(input.orderId);
    if (orderIdResult.isFailure) {
      return Result.fail(orderIdResult.getError());
    }

    const scheduledDateResult = DateTimeVO.createResult(input.scheduledDate);
    if (scheduledDateResult.isFailure) {
      return Result.fail(scheduledDateResult.getError());
    }

    const makeResult = makeDelivery({
      orderId: input.orderId,
      scheduledDate: input.scheduledDate,
      deliveryTime: input.deliveryTime,
      address: input.address,
      status: DeliveryStatus.PENDING,
      notes: input.notes,
    });
    if (makeResult.isFailure) {
      return Result.fail(makeResult.getError());
    }

    const deliveryEntity = makeResult.getValue();

    const savedDeliveryResult = await deliveryRepository.create(deliveryEntity, IdVO.generateNil());
    if (savedDeliveryResult.isFailure) {
      return Result.fail(savedDeliveryResult.getError());
    }

    return Result.ok(savedDeliveryResult.getValue());
  };
};
