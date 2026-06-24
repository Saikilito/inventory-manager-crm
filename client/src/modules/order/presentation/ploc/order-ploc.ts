import { makePloc, Ploc } from '@modules/shared/presentation/ploc/ploc';
import { ordersInitialState, OrdersState, OrdersStateKind } from './order-state';
import { GetClientOrdersUseCase } from '@modules/order/application/use-cases/get-client-orders';
import { CreateOrderUseCase } from '@modules/order/application/use-cases/create-order';
import { UpdateOrderUseCase } from '@modules/order/application/use-cases/update-order';
import { IdVO } from '@shared-domain/shared/value-objects/id.vo';
import { makeOrder, OrderStatus, IOrder } from '@shared-domain/order/order.entity';

export interface OrdersPloc extends Ploc<OrdersState> {
  loadClientOrders(clientId: string): Promise<void>;
  createOrder(clientId: string, items: Array<{ productId: string; quantity: number }>, total: number, sellerId: string): Promise<void>;
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
        errorMessage: result.getError().message || 'Error al cargar los pedidos',
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
    sellerId: string
  ) => {
    ploc.changeState({ kind: OrdersStateKind.LOADING });

    try {
      const orderEntity = makeOrder({
        clientId,
        items,
        total,
        sellerId,
        status: OrderStatus.PENDING,
      });

      const result = await createOrderUseCase.execute(orderEntity);

      if (result.isFailure) {
        ploc.changeState({
          kind: OrdersStateKind.ERROR,
          errorMessage: result.getError().message || 'Error al crear el pedido',
        });
      } else {
        // Reload order list
        loadClientOrders(clientId);
      }
    } catch (e: any) {
      ploc.changeState({
        kind: OrdersStateKind.ERROR,
        errorMessage: e.message || 'Error de validación del dominio',
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
      });

      const result = await updateOrderUseCase.execute(updatedOrder);

      if (result.isFailure) {
        ploc.changeState({
          kind: OrdersStateKind.ERROR,
          errorMessage: result.getError().message || 'Error al actualizar el estado del pedido',
        });
      } else {
        loadClientOrders(String(order.clientId));
      }
    } catch (e: any) {
      ploc.changeState({
        kind: OrdersStateKind.ERROR,
        errorMessage: e.message || 'Error de dominio',
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
