import { IOrder } from '@shared-domain/order/order.entity.js';

export const OrdersStateKind = {
  IDLE: 'orders:idle',
  LOADING: 'orders:loading',
  LOADED: 'orders:loaded',
  ERROR: 'orders:error',
} as const;

export type OrdersStateKind = typeof OrdersStateKind[keyof typeof OrdersStateKind];

export interface CommonOrdersState {
  errorMessage?: string;
}

export interface IdleOrdersState {
  kind: typeof OrdersStateKind.IDLE;
}

export interface LoadingOrdersState {
  kind: typeof OrdersStateKind.LOADING;
}

export interface LoadedOrdersState {
  kind: typeof OrdersStateKind.LOADED;
  orders: IOrder[];
}

export interface ErrorOrdersState {
  kind: typeof OrdersStateKind.ERROR;
  errorMessage: string;
}

export type OrdersState = (
  | IdleOrdersState
  | LoadingOrdersState
  | LoadedOrdersState
  | ErrorOrdersState
) & CommonOrdersState;

export const ordersInitialState: OrdersState = {
  kind: OrdersStateKind.IDLE,
};
