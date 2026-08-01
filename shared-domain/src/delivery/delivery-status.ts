export const DeliveryStatus = Object.freeze({
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const);

export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const DELIVERY_STATUSES = Object.values(DeliveryStatus);
