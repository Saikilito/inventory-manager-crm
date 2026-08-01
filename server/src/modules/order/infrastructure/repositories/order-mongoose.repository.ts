import mongoose from 'mongoose';
import { IOrderRepository } from '../../application/repositories/order.repository.js';
import {
  IOrder,
  makeOrder,
  OrderStatus,
  PaymentStatus,
  ORDER_DEFAULT_PRICE_FALLBACK,
} from '../../../../../../shared-domain/src/order/order.entity.js';
import OrderModel, { IOrderDocument } from '../order.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';

const mapToDomain = (doc: IOrderDocument): IOrder => {
  const createdAtRaw = doc.createdAt as unknown;
  const createdAtStr =
    createdAtRaw instanceof Date
      ? createdAtRaw.toISOString()
      : typeof createdAtRaw === 'string'
        ? createdAtRaw
        : new Date().toISOString();

  return makeOrder({
    id: doc._id.toString(),
    items: doc.items.map((item) => ({
      productId: item.productId.toString(),
      quantity: item.quantity,
      purchasePriceAtSale:
        item.purchasePriceAtSale !== undefined && item.purchasePriceAtSale !== null
          ? item.purchasePriceAtSale
          : ORDER_DEFAULT_PRICE_FALLBACK,
      sellingPriceAtSale:
        item.sellingPriceAtSale !== undefined && item.sellingPriceAtSale !== null
          ? item.sellingPriceAtSale
          : ORDER_DEFAULT_PRICE_FALLBACK,
    })),
    total: doc.total,
    createdAt: createdAtStr,
    clientId: doc.clientId.toString(),
    status: doc.status as OrderStatus,
    paymentStatus: doc.paymentStatus || PaymentStatus.PENDING,
    sellerId: doc.sellerId.toString(),
    contextId: doc.contextId?.toString(),
    deliveryId: doc.deliveryId?.toString(),
    deliveryCost: doc.deliveryCost ?? undefined,
    customDeliveryAddress: doc.customDeliveryAddress ?? undefined,
    payments: doc.payments?.map((p) => ({
      accountId: p.accountId.toString(),
      amount: p.amount,
      exchangeRate: p.exchangeRate,
    })),
    cancellationObservation: doc.cancellationObservation,
  });
};

export const makeOrderMongooseRepository = (): IOrderRepository => {
  return makeMongooseBaseRepository<IOrder, IOrderDocument>({
    model: OrderModel,
    mapToDomain,
    mapToDocumentData: (order) => {
      const data: Partial<IOrderDocument> = {};
      if (order.items !== undefined) {
        data.items = order.items.map((item) => ({
          productId: new mongoose.Types.ObjectId(item.productId),
          quantity: item.quantity,
          purchasePriceAtSale: item.purchasePriceAtSale,
          sellingPriceAtSale: item.sellingPriceAtSale,
        }));
      }
      if (order.total !== undefined) data.total = order.total;
      if (order.status !== undefined) data.status = order.status;
      if (order.paymentStatus !== undefined) data.paymentStatus = order.paymentStatus;

      if (order.clientId !== undefined) {
        data.clientId = new mongoose.Types.ObjectId(order.clientId);
      }

      if (order.sellerId !== undefined) {
        data.sellerId = new mongoose.Types.ObjectId(order.sellerId);
      }

      if (order.contextId !== undefined) {
        data.contextId = order.contextId ? new mongoose.Types.ObjectId(order.contextId) : null;
      }

      if (order.deliveryId !== undefined) {
        data.deliveryId = order.deliveryId ? new mongoose.Types.ObjectId(order.deliveryId) : null;
      }
      if (order.deliveryCost !== undefined) data.deliveryCost = order.deliveryCost;
      if (order.customDeliveryAddress !== undefined) data.customDeliveryAddress = order.customDeliveryAddress;
      if (order.payments !== undefined) {
        data.payments = order.payments.map((p) => ({
          accountId: new mongoose.Types.ObjectId(p.accountId),
          amount: p.amount,
          exchangeRate: p.exchangeRate,
        }));
      }
      if (order.cancellationObservation !== undefined) data.cancellationObservation = order.cancellationObservation;
      return data;
    },
  });
};
