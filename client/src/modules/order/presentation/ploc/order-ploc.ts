import { makePloc, Ploc } from '@modules/shared/presentation/ploc/ploc';
import { ordersInitialState, OrdersState, OrdersStateKind } from './order-state';
import { GetClientOrdersUseCase } from '@modules/order/application/use-cases/get-client-orders';
import { CreateOrderUseCase } from '@modules/order/application/use-cases/create-order';
import { UpdateOrderUseCase } from '@modules/order/application/use-cases/update-order';
import { IdVO } from '@shared-domain/shared/value-objects/id.vo';
import { makeOrder, OrderStatus, IOrder } from '@shared-domain/order/order.entity';

export interface OrdersPloc extends Ploc<OrdersState> {
  loadClientOrders(clientId: string): Promise<void>;
  createOrder(clientId: string, items: Array<{ productId: string; quantity: number }>, total: number, sellerId: string, contextId?: string, deliveryCost?: number): Promise<void>;
  updateOrderStatus(order: IOrder, newStatus: OrderStatus): Promise<void>;
}

export function makeOrdersPloc(
  getClientOrders: GetClientOrdersUseCase,
  createOrderUseCase: CreateOrderUseCase,
  updateOrderUseCase: UpdateOrderUseCase
): OrdersPloc {
  const ploc = makePloc<OrdersState>(ordersInitialState);

  const loadClientOrders = async (clientId: string) => {
    ploc.changeState({ kind: OrdersStateKind.LOADING });
    const clientIdVO = IdVO.create(clientId);

    const result = await getClientOrders.execute(clientIdVO);

    if (result.isFailure) {
      ploc.changeState({
        kind: OrdersStateKind.ERROR,
        errorMessage: result.getError().message || 'Error loading orders',
      });
    } else {
      ploc.changeState({
        kind: OrdersStateKind.LOADED,
        orders: result.getValue(),
      });
    }
  };

  const createOrder = async (
    clientId: string,
    items: Array<{ productId: string; quantity: number }>,
    total: number,
    sellerId: string,
    contextId?: string,
    deliveryCost?: number
  ) => {
    ploc.changeState({ kind: OrdersStateKind.LOADING });

    try {
      const orderEntity = makeOrder({
        clientId,
        items,
        total,
        sellerId,
        status: OrderStatus.ACTIVE,
        contextId,
        deliveryCost,
      });

      const result = await createOrderUseCase.execute(orderEntity);

      if (result.isFailure) {
        ploc.changeState({
          kind: OrdersStateKind.ERROR,
          errorMessage: result.getError().message || 'Error creating order',
        });
      } else {
        ploc.changeState({ kind: OrdersStateKind.IDLE });
      }
    } catch (e: unknown) {
      ploc.changeState({
        kind: OrdersStateKind.ERROR,
        errorMessage: e instanceof Error ? e.message : 'Domain validation error',
      });
    }
  };

  const updateOrderStatus = async (order: IOrder, newStatus: OrderStatus) => {
    ploc.changeState({ kind: OrdersStateKind.LOADING });

    try {
      const updatedOrder = makeOrder({
        id: String(order.id),
        clientId: String(order.clientId),
        items: order.items.map((i) => ({ productId: String(i.productId), quantity: Number(i.quantity) })),
        total: Number(order.total),
        createdAt: String(order.createdAt),
        status: newStatus,
        sellerId: String(order.sellerId),
        contextId: order.contextId ? String(order.contextId) : undefined,
      });

      const result = await updateOrderUseCase.execute(updatedOrder);

      if (result.isFailure) {
        ploc.changeState({
          kind: OrdersStateKind.ERROR,
          errorMessage: result.getError().message || 'Error updating order status',
        });
      } else {
        loadClientOrders(String(order.clientId));
      }
    } catch (e: unknown) {
      ploc.changeState({
        kind: OrdersStateKind.ERROR,
        errorMessage: e instanceof Error ? e.message : 'Domain error',
      });
    }
  };

  return {
    ...ploc,
    loadClientOrders,
    createOrder,
    updateOrderStatus,
  };
}
