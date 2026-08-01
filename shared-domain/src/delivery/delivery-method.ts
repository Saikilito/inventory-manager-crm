export const DeliveryMethod = Object.freeze({
  PICKUP: 'PICKUP',
  DELIVERY: 'DELIVERY',
} as const);

export type DeliveryMethod = (typeof DeliveryMethod)[keyof typeof DeliveryMethod];

export const DELIVERY_METHODS = Object.values(DeliveryMethod);
