import { IContext as IContextApollo } from '../../../config/apollo.js';
import { IDelivery } from '../../../../../shared-domain/src/delivery/delivery.entity.js';

const mapToGql = (delivery: IDelivery) => {
  return {
    id: delivery.id,
    _id: delivery.id,
    orderId: delivery.orderId,
    scheduledDate: delivery.scheduledDate,
    deliveryTime: delivery.deliveryTime,
    address: delivery.address,
    status: delivery.status,
    notes: delivery.notes,
  };
};

export default {
  Query: {
    getAllDeliveries: async (_parent: unknown, _args: unknown, { container }: IContextApollo) => {
      const result = await container.delivery.deliveryRepository.getAll();
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().items.map(mapToGql);
    },

    getDelivery: async (_parent: unknown, { id }: { id: string }, { container }: IContextApollo) => {
      const result = await container.delivery.getDelivery(id);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },
  },

  Mutation: {
    scheduleDelivery: async (
      _parent: unknown,
      { input }: { input: { orderId: string; scheduledDate: string; deliveryTime: string; address: string; notes?: string } },
      { container }: IContextApollo,
    ) => {
      const result = await container.delivery.scheduleDelivery({
        orderId: input.orderId,
        scheduledDate: input.scheduledDate,
        deliveryTime: input.deliveryTime,
        address: input.address,
        notes: input.notes,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    updateDeliveryStatus: async (
      _parent: unknown,
      { id, status }: { id: string; status: string },
      { container }: IContextApollo,
    ) => {
      const result = await container.delivery.updateDeliveryStatus({ id, status });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },
  },

  Delivery: {
    deliveryCost: async (delivery: IDelivery, _args: unknown, { container }: IContextApollo) => {
      const orderResult = await container.order.getOrder(delivery.orderId.toString());
      if (orderResult.isFailure) {
        return 0;
      }
      const order = orderResult.getValue();
      return order.deliveryCost ? order.deliveryCost.valueOf() : 0;
    },
    paymentAccounts: async (delivery: IDelivery, _args: unknown, { container }: IContextApollo) => {
      const orderResult = await container.order.getOrder(delivery.orderId.toString());
      if (orderResult.isFailure) {
        return [];
      }
      const order = orderResult.getValue();
      if (!order.payments || order.payments.length === 0) {
        return [];
      }
      const accountNames = new Set<string>();
      for (const payment of order.payments) {
        const accResult = await container.financial.accountRepository.getById(payment.accountId);
        if (!accResult.isFailure && accResult.getValue()) {
          accountNames.add(accResult.getValue()!.name.toString());
        }
      }
      return Array.from(accountNames);
    },
  },
};
