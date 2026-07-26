import { makeDeliveryMongooseRepository } from '../../modules/delivery/infrastructure/repositories/delivery-mongoose.repository.js';
import { GetDelivery, makeGetDelivery } from '../../modules/delivery/application/use-cases/get-delivery.js';
import { ScheduleDelivery, makeScheduleDelivery } from '../../modules/delivery/application/use-cases/schedule-delivery.js';
import { UpdateDeliveryStatus, makeUpdateDeliveryStatus } from '../../modules/delivery/application/use-cases/update-delivery-status.js';
import { IDeliveryRepository } from '../../modules/delivery/application/repositories/delivery.repository.js';
import { IOrderRepository } from '../../modules/order/application/repositories/order.repository.js';
import { RecordDeliveryPaymentUseCase } from '../../modules/financial/application/use-cases/record-delivery-payment.js';

export interface DeliverySubContainer {
  getDelivery: GetDelivery;
  scheduleDelivery: ScheduleDelivery;
  updateDeliveryStatus: UpdateDeliveryStatus;
  deliveryRepository: IDeliveryRepository;
}

export const buildDeliveryModule = (deps: {
  deliveryRepository?: IDeliveryRepository;
  orderRepository: IOrderRepository;
  recordDeliveryPayment: RecordDeliveryPaymentUseCase;
}): DeliverySubContainer => {
  const deliveryRepository = deps.deliveryRepository ?? makeDeliveryMongooseRepository();
  return {
    getDelivery: makeGetDelivery(deliveryRepository),
    scheduleDelivery: makeScheduleDelivery(deliveryRepository),
    updateDeliveryStatus: makeUpdateDeliveryStatus(deliveryRepository, deps.orderRepository, deps.recordDeliveryPayment),
    deliveryRepository,
  };
};
