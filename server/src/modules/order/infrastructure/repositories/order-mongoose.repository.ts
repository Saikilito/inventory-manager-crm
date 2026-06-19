import mongoose from 'mongoose';
import { IOrderRepository } from '../../application/repositories/order.repository.js';
import { IOrder, makeOrder, OrderStatus } from '../../../../../../shared-domain/src/order/order.entity.js';
import OrderModel, { IOrderDocument } from '../order.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';

const mapToDomain = (doc: IOrderDocument): IOrder => {
  const createdAtRaw = doc.createdAt as unknown;
  const createdAtStr = createdAtRaw instanceof Date
    ? createdAtRaw.toISOString()
    : typeof createdAtRaw === 'string'
      ? createdAtRaw
      : new Date().toISOString();

  return makeOrder({
    id: doc._id.toString(),
    items: doc.items.map((item: any) => ({
      productId: item.productId.toString(),
      quantity: item.quantity,
    })),
    total: doc.total,
    createdAt: createdAtStr,
    clientId: doc.clientId.toString(),
    status: doc.status as OrderStatus,
    sellerId: doc.sellerId.toString(),
  });
};

export const makeOrderMongooseRepository = (): IOrderRepository => {
  return makeMongooseBaseRepository<IOrder, IOrderDocument>({
    model: OrderModel,
    mapToDomain,
    mapToDocumentData: (order) => {
      const data: any = {};
      if (order.items !== undefined) {
        data.items = order.items.map((item: any) => ({
          productId: new mongoose.Types.ObjectId(item.productId),
          quantity: item.quantity,
        }));
      }
      if (order.total !== undefined) data.total = order.total;
      if (order.status !== undefined) data.status = order.status;
      if (order.clientId !== undefined) data.clientId = new mongoose.Types.ObjectId(order.clientId);
      if (order.sellerId !== undefined) data.sellerId = new mongoose.Types.ObjectId(order.sellerId);
      return data;
    },
  });
};
