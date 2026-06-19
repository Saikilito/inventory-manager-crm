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
}

interface UpdateOrderInput {
  _id: string;
  items?: OrderItemInput[];
  total?: number;
  clientId?: string;
  status?: OrderStatus;
  sellerId?: string;
}

const mapToGql = (order: IOrder) => {
  return {
    _id: order.id,
    items: (order.items || []).map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
    total: order.total,
    createdAt: order.createdAt,
    clientId: order.clientId,
    status: order.status,
    sellerId: order.sellerId,
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
      { limit, offset }: { limit?: number; offset?: number },
      { container }: IContext,
    ) => {
      const result = await container.order.getAllOrders({ limit, offset });
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
        sellerId: input.sellerId,
      });
      return !result.isFailure;
    },

    deleteOrder: async (_parent: unknown, { _id }: { _id: string }, { container }: IContext) => {
      const result = await container.order.deleteOrder(_id);
      return !result.isFailure;
    },
  },
};
