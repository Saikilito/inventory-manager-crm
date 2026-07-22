import { IContext } from '../../../config/apollo.js';
import { IOrder, OrderStatus } from '../../../../../shared-domain/src/order/order.entity.js';

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
}

interface GetAllOrdersInput {
  limit?: number;
  offset?: number;
  date?: string;
}

const mapToGql = (order: IOrder) => {
  return {
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
  };
};

// Helper to build date range filter for a specific day
const buildDateFilter = (dateStr: string) => {
  // dateStr is expected in YYYY-MM-DD format
  const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
  const endOfDay = new Date(dateStr + 'T23:59:59.999Z');
  
  return {
    field: 'createdAt',
    operator: '>=' as const,
    value: startOfDay.toISOString(),
  };
};

export default {
  Query: {
    getOrder: async (_parent: unknown, { _id }: { _id: string }, { container }: IContext) => {
      const result = await container.order.getOrder(_id);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    getOrderClient: async (_parent: unknown, { clientId }: { clientId: string }, { container }: IContext) => {
      const result = await container.order.getOrderClient(clientId);
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().map(mapToGql);
    },

    getAllOrders: async (
      _parent: unknown,
      { limit, offset, date }: GetAllOrdersInput,
      { container }: IContext,
    ) => {
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
      });
      return !result.isFailure;
    },

    deleteOrder: async (_parent: unknown, { _id }: { _id: string }, { container }: IContext) => {
      const result = await container.order.deleteOrder(_id);
      return !result.isFailure;
    },
  },
};
