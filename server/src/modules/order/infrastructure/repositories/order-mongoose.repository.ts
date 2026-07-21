import mongoose from 'mongoose';
import { IOrderRepository } from '../../application/repositories/order.repository.js';
import { IOrder, makeOrder, OrderStatus, PaymentStatus, DeliveryStatus, ORDER_DEFAULT_PRICE_FALLBACK } from '../../../../../../shared-domain/src/order/order.entity.js';
import OrderModel, { IOrderDocument } from '../order.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';

interface IRawMongooseOrderItem {
  productId: mongoose.Types.ObjectId | string;
  quantity: number;
  purchasePriceAtSale?: number;
  sellingPriceAtSale?: number;
}

const mapToDomain = (doc: IOrderDocument): IOrder => {
  const createdAtRaw = doc.createdAt as unknown;
  const createdAtStr = createdAtRaw instanceof Date
    ? createdAtRaw.toISOString()
    : typeof createdAtRaw === 'string'
      ? createdAtRaw
      : new Date().toISOString();

  return makeOrder({
    id: doc._id.toString(),
    items: (doc.items as unknown as IRawMongooseOrderItem[]).map((item) => ({
      productId: item.productId.toString(),
      quantity: item.quantity,
      purchasePriceAtSale: item.purchasePriceAtSale !== undefined && item.purchasePriceAtSale !== null ? item.purchasePriceAtSale : ORDER_DEFAULT_PRICE_FALLBACK,
      sellingPriceAtSale: item.sellingPriceAtSale !== undefined && item.sellingPriceAtSale !== null ? item.sellingPriceAtSale : ORDER_DEFAULT_PRICE_FALLBACK,
    })),
    total: doc.total,
    createdAt: createdAtStr,
    clientId: doc.clientId.toString(),
    status: doc.status as OrderStatus,
    paymentStatus: doc.paymentStatus || PaymentStatus.PENDING,
    deliveryStatus: doc.deliveryStatus || DeliveryStatus.PENDING,
    sellerId: doc.sellerId.toString(),
    contextId: doc.contextId?.toString(),
  });
};

export const makeOrderMongooseRepository = (): IOrderRepository => {
  return makeMongooseBaseRepository<IOrder, IOrderDocument>({
    model: OrderModel,
    mapToDomain,
    mapToDocumentData: (order) => {
      const data: Partial<IOrderDocument> = {};
      if (order.items !== undefined) {
        data.items = order.items.map((item: NonNullable<IOrder['items']>[number]) => ({
          productId: new mongoose.Types.ObjectId(item.productId) as unknown as mongoose.Types.ObjectId,
          quantity: item.quantity,
          purchasePriceAtSale: item.purchasePriceAtSale,
          sellingPriceAtSale: item.sellingPriceAtSale,
        }));
      }
      if (order.total !== undefined) data.total = order.total;
      if (order.status !== undefined) data.status = order.status;
      if (order.paymentStatus !== undefined) data.paymentStatus = order.paymentStatus;
      if (order.deliveryStatus !== undefined) data.deliveryStatus = order.deliveryStatus;
      if (order.clientId !== undefined) data.clientId = new mongoose.Types.ObjectId(order.clientId);
      if (order.sellerId !== undefined) data.sellerId = new mongoose.Types.ObjectId(order.sellerId);
      if (order.contextId !== undefined) data.contextId = order.contextId ? new mongoose.Types.ObjectId(order.contextId) : null;
      return data;
    },
  });
};
