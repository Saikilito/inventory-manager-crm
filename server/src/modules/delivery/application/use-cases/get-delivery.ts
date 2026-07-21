import { makeGetByIdUseCase } from '../../../../../../shared-domain/src/shared/make-get-by-id.js';
import { IDelivery } from '../../../../../../shared-domain/src/delivery/delivery.entity.js';
import { IDeliveryRepository } from '../repositories/delivery.repository.js';

export type GetDelivery = ReturnType<typeof makeGetDelivery>;

export const makeGetDelivery = (deliveryRepository: IDeliveryRepository) =>
  makeGetByIdUseCase<IDelivery>('Delivery', (id) => deliveryRepository.getById(id));
