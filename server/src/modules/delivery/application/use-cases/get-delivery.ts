import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IDelivery } from '../../../../../../shared-domain/src/delivery/delivery.entity.js';
import { IDeliveryRepository } from '../repositories/delivery.repository.js';

export type GetDelivery = UseCase<string, IDelivery, DomainError>;

export const makeGetDelivery = (deliveryRepository: IDeliveryRepository): GetDelivery => {
  return async (id: string) => {
    const idResult = IdVO.createResult(id);
    if (idResult.isFailure) {
      return Result.fail(idResult.getError());
    }

    const deliveryResult = await deliveryRepository.getById(idResult.getValue());
    if (deliveryResult.isFailure) {
      return Result.fail(deliveryResult.getError());
    }

    const delivery = deliveryResult.getValue();
    if (!delivery) {
      return Result.fail(new NotFoundError(`Delivery with ID ${id} not found`));
    }

    return Result.ok(delivery);
  };
};
