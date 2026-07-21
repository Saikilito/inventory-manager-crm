import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { OrderRepository } from '@modules/order/domain/order.repository';
import { IOrder, makeOrder, OrderStatus } from '@shared-domain/order/order.entity';
import { doTryResult } from '@shared-domain/shared/do-try-result';
import { DatabaseError } from '@shared-domain/shared/errors';
import { CLIENT_ORDERS_QUERY } from '../graphql/queries';
import { CREATE_ORDER, UPDATE_ORDER } from '../graphql/mutations';

interface GQLOrderItem {
  productId: string;
  quantity: number;
}

interface GQLOrder {
  _id: string;
  items: GQLOrderItem[];
  total: number;
  createdAt: string;
  clientId: string;
  status: OrderStatus;
  sellerId: string;
  contextId?: string;
}

interface GetOrderClientData {
  getOrderClient: GQLOrder[];
}

export function makeApolloOrderRepository(
  apolloClient: ApolloClient<NormalizedCacheObject>
): OrderRepository {

  const mapGQLToDomain = (gqlOrder: GQLOrder): IOrder => {
    return makeOrder({
      id: gqlOrder._id,
      items: gqlOrder.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      total: gqlOrder.total,
      createdAt: gqlOrder.createdAt,
      clientId: gqlOrder.clientId,
      status: gqlOrder.status,
      sellerId: gqlOrder.sellerId,
      contextId: gqlOrder.contextId,
    });
  };

  return {
    getClientOrders: async (clientId) => {
      return doTryResult(
        async (): Promise<IOrder[]> => {
          const { data } = await apolloClient.query<GetOrderClientData>({
            query: CLIENT_ORDERS_QUERY,
            variables: { clientId: String(clientId) },
            fetchPolicy: 'no-cache',
          });

          return (data?.getOrderClient || []).map(mapGQLToDomain);
        },
        (err) => new DatabaseError(err.message)
      );
    },

    create: async (order) => {
      return doTryResult(
        async (): Promise<boolean> => {
          const { data } = await apolloClient.mutate<{ setOrder: boolean }>({
            mutation: CREATE_ORDER,
            variables: {
              input: {
                items: order.items.map((i) => ({
                  productId: String(i.productId),
                  quantity: Number(i.quantity),
                })),
                total: Number(order.total),
                clientId: String(order.clientId),
                status: order.status,
                sellerId: String(order.sellerId),
                contextId: order.contextId ? String(order.contextId) : null,
              },
            },
          });

          return data?.setOrder ?? true;
        },
        (err) => new DatabaseError(err.message)
      );
    },

    update: async (order) => {
      return doTryResult(
        async (): Promise<boolean> => {
          const { data } = await apolloClient.mutate<{ updateOrder: boolean }>({
            mutation: UPDATE_ORDER,
            variables: {
              input: {
                _id: String(order.id),
                items: order.items.map((i) => ({
                  productId: String(i.productId),
                  quantity: Number(i.quantity),
                })),
                total: Number(order.total),
                clientId: String(order.clientId),
                status: order.status,
                sellerId: String(order.sellerId),
                contextId: order.contextId ? String(order.contextId) : null,
              },
            },
          });

          return data?.updateOrder ?? true;
        },
        (err) => new DatabaseError(err.message)
      );
    },
  };
}
