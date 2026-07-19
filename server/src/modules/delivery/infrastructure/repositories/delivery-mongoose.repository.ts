import { IDelivery, makeDelivery } from '../../../../../../shared-domain/src/delivery/delivery.entity.js';
import { IDeliveryDocument, DeliveryModel } from '../delivery.model.js';
import { IDeliveryRepository } from '../../application/repositories/delivery.repository.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';

const mapToDomain = (doc: IDeliveryDocument): IDelivery => {
  const result = makeDelivery({
    id: doc._id.toString(),
    orderId: doc.orderId.toString(),
    scheduledDate: doc.scheduledDate,
    deliveryTime: doc.deliveryTime,
    address: doc.address,
    status: doc.status,
    notes: doc.notes,
  });
  if (result.isFailure) {
    throw result.getError();
  }
  return result.getValue();
};

export const makeDeliveryMongooseRepository = (): IDeliveryRepository => {
  const base = makeMongooseBaseRepository<IDelivery, IDeliveryDocument>({
    model: DeliveryModel,
    mapToDomain,
    mapToDocumentData: (delivery) => {
      const data: Partial<IDeliveryDocument> = {};
      if (delivery.orderId !== undefined) data.orderId = delivery.orderId;
      if (delivery.scheduledDate !== undefined) data.scheduledDate = delivery.scheduledDate;
      if (delivery.deliveryTime !== undefined) data.deliveryTime = delivery.deliveryTime;
      if (delivery.address !== undefined) data.address = delivery.address;
      if (delivery.status !== undefined) data.status = delivery.status;
      if (delivery.notes !== undefined) data.notes = delivery.notes;
      return data;
    },
  });

  return {
    ...base,
  };
};
