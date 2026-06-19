import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonNegativeNumber, NonNegativeNumberVO } from '../shared/value-objects/non-negative-number.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';

export interface IOrderItem {
  productId: Id;
  quantity: NonNegativeNumber;
}

export const OrderStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export interface IOrder {
  id?: Id;
  items: IOrderItem[];
  total: NonNegativeNumber;
  createdAt?: NonEmptyString;
  clientId: Id;
  status: OrderStatus;
  sellerId: Id;
}

export const makeOrder = (props: {
  id?: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
  createdAt?: string;
  clientId: string;
  status: OrderStatus;
  sellerId: string;
}): IOrder => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    items: (props.items || []).map(item => ({
      productId: IdVO.create(item.productId),
      quantity: NonNegativeNumberVO.create(item.quantity)
    })),
    total: NonNegativeNumberVO.create(props.total),
    createdAt: NonEmptyStringVO.create(props.createdAt || new Date().toISOString()),
    clientId: IdVO.create(props.clientId),
    status: props.status || OrderStatus.PENDING,
    sellerId: IdVO.create(props.sellerId),
  };
};
