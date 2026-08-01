import { OrderStatus, PaymentStatus } from './order-status.js';
import { DeliveryStatus } from '../delivery/delivery-status.js';
import { Result } from '../shared/result.js';
import { ValidationError, createValidationError } from '../shared/validation-error.js';

export const resolveOrderStatus = (input: {
  requestedStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus | null;
}): OrderStatus => {
  const isDeliveryComplete = input.deliveryStatus === null || input.deliveryStatus === DeliveryStatus.DELIVERED;
  const isPaidAndDelivered = input.paymentStatus === PaymentStatus.PAID && isDeliveryComplete;

  if (input.paymentStatus === PaymentStatus.REFUNDED) {
    return OrderStatus.CANCELLED;
  }
  if (input.requestedStatus === OrderStatus.COMPLETED) {
    return isPaidAndDelivered ? OrderStatus.COMPLETED : OrderStatus.ACTIVE;
  }
  if (isPaidAndDelivered && input.requestedStatus !== OrderStatus.CANCELLED) {
    return OrderStatus.COMPLETED;
  }
  return input.requestedStatus;
};

export const assertOrderCancellable = (input: {
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus | null;
}): Result<void, ValidationError> => {
  const isDeliveryInProgressOrDone =
    input.deliveryStatus === DeliveryStatus.SENT || input.deliveryStatus === DeliveryStatus.DELIVERED;
  if (input.paymentStatus === PaymentStatus.PAID && isDeliveryInProgressOrDone) {
    return Result.fail(createValidationError('Cannot cancel an order that is PAID and SENT/DELIVERED'));
  }
  return Result.ok(undefined);
};
