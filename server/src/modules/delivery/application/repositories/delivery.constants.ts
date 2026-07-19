export const DeliveryField = {
  OrderId: "orderId",
} as const;

export type DeliveryField = (typeof DeliveryField)[keyof typeof DeliveryField];
