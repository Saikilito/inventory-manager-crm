import { describe, it, expect } from 'vitest';
import { resolveOrderStatus, assertOrderCancellable } from '../order-status.rules.js';
import { OrderStatus, PaymentStatus } from '../order-status.js';
import { DeliveryStatus } from '../../delivery/delivery-status.js';
import { ValidationError } from '../../shared/validation-error.js';

describe('resolveOrderStatus', () => {
  it('cancels the order when payment is REFUNDED, regardless of requested status', () => {
    const status = resolveOrderStatus({
      requestedStatus: OrderStatus.ACTIVE,
      paymentStatus: PaymentStatus.REFUNDED,
      deliveryStatus: DeliveryStatus.DELIVERED,
    });
    expect(status).toBe(OrderStatus.CANCELLED);
  });

  it('demotes a requested COMPLETED to ACTIVE when not paid', () => {
    const status = resolveOrderStatus({
      requestedStatus: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PENDING,
      deliveryStatus: DeliveryStatus.DELIVERED,
    });
    expect(status).toBe(OrderStatus.ACTIVE);
  });

  it('demotes a requested COMPLETED to ACTIVE when paid but only SENT, not DELIVERED', () => {
    const status = resolveOrderStatus({
      requestedStatus: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.SENT,
    });
    expect(status).toBe(OrderStatus.ACTIVE);
  });

  it('accepts a requested COMPLETED when paid and DELIVERED', () => {
    const status = resolveOrderStatus({
      requestedStatus: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.DELIVERED,
    });
    expect(status).toBe(OrderStatus.COMPLETED);
  });

  it('auto-promotes to COMPLETED when paid and DELIVERED, even if not explicitly requested', () => {
    const status = resolveOrderStatus({
      requestedStatus: OrderStatus.ACTIVE,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.DELIVERED,
    });
    expect(status).toBe(OrderStatus.COMPLETED);
  });

  it('does not auto-promote a CANCELLED order even if paid and delivered', () => {
    const status = resolveOrderStatus({
      requestedStatus: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.DELIVERED,
    });
    expect(status).toBe(OrderStatus.CANCELLED);
  });

  it('treats a null deliveryStatus (no linked Delivery, in-store pickup) as delivered', () => {
    const status = resolveOrderStatus({
      requestedStatus: OrderStatus.ACTIVE,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: null,
    });
    expect(status).toBe(OrderStatus.COMPLETED);
  });

  it('keeps a pickup order (null deliveryStatus) ACTIVE when not yet paid', () => {
    const status = resolveOrderStatus({
      requestedStatus: OrderStatus.ACTIVE,
      paymentStatus: PaymentStatus.PENDING,
      deliveryStatus: null,
    });
    expect(status).toBe(OrderStatus.ACTIVE);
  });

  it('passes through the requested status unchanged in the default case', () => {
    const status = resolveOrderStatus({
      requestedStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      deliveryStatus: DeliveryStatus.PENDING,
    });
    expect(status).toBe(OrderStatus.PENDING);
  });
});

describe('assertOrderCancellable', () => {
  it('fails when the order is PAID and the delivery is SENT', () => {
    const result = assertOrderCancellable({
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.SENT,
    });
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.getError()).toBeInstanceOf(ValidationError);
    }
  });

  it('fails when the order is PAID and the delivery is DELIVERED', () => {
    const result = assertOrderCancellable({
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.DELIVERED,
    });
    expect(result.isFailure).toBe(true);
  });

  it('succeeds when the order is PAID but the delivery is only PENDING', () => {
    const result = assertOrderCancellable({
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.PENDING,
    });
    expect(result.isFailure).toBe(false);
  });

  it('succeeds when the order is PAID with no linked delivery (in-store pickup)', () => {
    const result = assertOrderCancellable({
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: null,
    });
    expect(result.isFailure).toBe(false);
  });

  it('succeeds when the order is not PAID, regardless of delivery status', () => {
    const result = assertOrderCancellable({
      paymentStatus: PaymentStatus.PENDING,
      deliveryStatus: DeliveryStatus.DELIVERED,
    });
    expect(result.isFailure).toBe(false);
  });
});
