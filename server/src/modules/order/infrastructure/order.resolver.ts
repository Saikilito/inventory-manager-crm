import { IContext } from '../../../config/apollo.js';
import {
  IOrder,
  OrderStatus,
  PaymentStatus,
  DeliveryStatus,
} from '../../../../../shared-domain/src/order/order.entity.js';
import OrderModel from './order.model.js';

interface PopulatedOrderItem {
  productId: { _id: string; name: string } | string;
  quantity: number;
  sellingPriceAtSale?: number;
  purchasePriceAtSale?: number;
}

interface PopulatedOrder {
  _id: string;
  items: PopulatedOrderItem[];
  total: number;
  createdAt: Date | string;
  clientId: string;
  status: OrderStatus;
  paymentStatus: string;
  deliveryStatus: string;
  sellerId: string;
  contextId?: string;
  deliveryId?: string;
  deliveryCost?: number;
  customDeliveryAddress?: string;
  payments?: Array<{ accountId: string; amount: number; exchangeRate: number }>;
  cancellationObservation?: string;
}

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface SetOrderInput {
  items: OrderItemInput[];
  total: number;
  clientId: string;
  sellerId: string;
  contextId?: string;
  deliveryCost?: number;
}

interface OrderPaymentInput {
  accountId: string;
  amount: number;
  exchangeRate: number;
}

interface UpdateOrderInput {
  _id: string;
  items?: OrderItemInput[];
  total?: number;
  clientId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
  sellerId?: string;
  contextId?: string;
  deliveryCost?: number;
  payments?: OrderPaymentInput[];
  cancellationObservation?: string;
}

interface GetAllOrdersInput {
  limit?: number;
  offset?: number;
  date?: string;
}

const mapToGql = (order: IOrder) => {
  return {
    id: order.id,
    _id: order.id,
    items: (order.items || []).map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      sellingPriceAtSale: item.sellingPriceAtSale,
      purchasePriceAtSale: item.purchasePriceAtSale,
    })),
    total: order.total,
    createdAt: order.createdAt,
    clientId: order.clientId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    sellerId: order.sellerId,
    contextId: order.contextId,
    deliveryId: order.deliveryId,
    deliveryCost: order.deliveryCost,
    customDeliveryAddress: order.customDeliveryAddress,
    payments: order.payments?.map((p) => ({
      accountId: p.accountId,
      amount: p.amount,
      exchangeRate: p.exchangeRate,
    })),
    cancellationObservation: order.cancellationObservation,
  };
};

const mapPopulatedToGql = (order: PopulatedOrder) => {
  return {
    id: order._id,
    _id: order._id,
    items: (order.items || []).map((item) => ({
      productId: typeof item.productId === 'string' ? item.productId : item.productId._id,
      productName: typeof item.productId === 'string' ? null : item.productId.name,
      quantity: item.quantity,
      sellingPriceAtSale: item.sellingPriceAtSale,
      purchasePriceAtSale: item.purchasePriceAtSale,
    })),
    total: order.total,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
    clientId: order.clientId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    sellerId: order.sellerId,
    contextId: order.contextId,
    deliveryId: order.deliveryId,
    deliveryCost: order.deliveryCost,
    customDeliveryAddress: order.customDeliveryAddress,
    payments: order.payments?.map((p) => ({
      accountId: p.accountId,
      amount: p.amount,
      exchangeRate: p.exchangeRate,
    })),
    cancellationObservation: order.cancellationObservation,
  };
};

export default {
  Query: {
    getOrder: async (_parent: unknown, { _id }: { _id: string }, { container }: IContext) => {
      const populatedOrder = await OrderModel.findById(_id).populate('items.productId', 'name').lean<PopulatedOrder>();

      if (!populatedOrder) {
        const result = await container.order.getOrder(_id);
        if (result.isFailure) {
          throw result.getError();
        }
        return mapToGql(result.getValue());
      }

      return mapPopulatedToGql(populatedOrder);
    },

    getOrderClient: async (_parent: unknown, { clientId }: { clientId: string }, { container }: IContext) => {
      const populatedOrders = await OrderModel.find({ clientId })
        .populate('items.productId', 'name')
        .lean<PopulatedOrder[]>();

      if (populatedOrders && populatedOrders.length > 0) {
        return populatedOrders.map(mapPopulatedToGql);
      }

      const result = await container.order.getOrderClient(clientId);
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().map(mapToGql);
    },

    getAllOrders: async (_parent: unknown, { limit, offset, date }: GetAllOrdersInput, { container }: IContext) => {
      let query = OrderModel.find();

      if (date) {
        const startOfDay = new Date(date + 'T00:00:00.000Z');
        const endOfDay = new Date(date + 'T23:59:59.999Z');
        query = query.where('createdAt').gte(startOfDay).lte(endOfDay);
      }

      if (limit) query = query.limit(limit);
      if (offset) query = query.skip(offset);

      const populatedOrders = await query
        .sort({ createdAt: -1 })
        .populate('items.productId', 'name')
        .lean<PopulatedOrder[]>();

      if (populatedOrders && populatedOrders.length > 0) {
        return populatedOrders.map(mapPopulatedToGql);
      }

      const result = await container.order.getAllOrders({ limit, offset, date });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().map(mapToGql);
    },

    totalOrders: async (_parent: unknown, _args: unknown, { container }: IContext) => {
      const result = await container.order.totalOrders();
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue();
    },
  },

  Mutation: {
    setOrder: async (_parent: unknown, { input }: { input: SetOrderInput }, { container }: IContext) => {
      const result = await container.order.createOrder({
        items: input.items,
        total: input.total,
        clientId: input.clientId,
        sellerId: input.sellerId,
        contextId: input.contextId,
        deliveryCost: input.deliveryCost,
      });
      return !result.isFailure;
    },

    updateOrder: async (_parent: unknown, { input }: { input: UpdateOrderInput }, { container }: IContext) => {
      const result = await container.order.updateOrder({
        id: input._id,
        items: input.items,
        total: input.total,
        clientId: input.clientId,
        status: input.status,
        paymentStatus: input.paymentStatus,
        deliveryStatus: input.deliveryStatus,
        sellerId: input.sellerId,
        contextId: input.contextId,
        deliveryCost: input.deliveryCost,
        payments: input.payments,
        cancellationObservation: input.cancellationObservation,
      });
      return !result.isFailure;
    },

    deleteOrder: async (_parent: unknown, { _id }: { _id: string }, { container }: IContext) => {
      const result = await container.order.deleteOrder(_id);
      return !result.isFailure;
    },
  },
};
