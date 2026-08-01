export const PaymentStatus = Object.freeze({
  PENDING: 'PENDING',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
} as const);
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export const PAYMENT_STATUSES = Object.values(PaymentStatus);

export const OrderStatus = Object.freeze({
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
} as const);
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export const ORDER_STATUSES = Object.values(OrderStatus);
