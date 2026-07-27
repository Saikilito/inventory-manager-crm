import { describe, it, expect } from 'vitest';
import { makeOrder, OrderStatus, PaymentStatus, DeliveryStatus } from '../order.entity.js';
import { ValidationError } from '../../shared/validation-error.js';

describe('makeOrder - Cancellation Observation', () => {
  const validOrderProps = {
    items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
    total: 100,
    clientId: '507f1f77bcf86cd799439012',
    status: OrderStatus.ACTIVE,
    sellerId: '507f1f77bcf86cd799439013',
  };

  describe('cancellationObservation field', () => {
    it('should accept optional cancellationObservation', () => {
      const order = makeOrder({
        ...validOrderProps,
        cancellationObservation: 'Valid cancellation reason here',
      });
      expect(order.cancellationObservation).toBe('Valid cancellation reason here');
    });

    it('should store undefined when no observation provided', () => {
      const order = makeOrder(validOrderProps);
      expect(order.cancellationObservation).toBeUndefined();
    });

    it('should trim whitespace from observation', () => {
      const order = makeOrder({
        ...validOrderProps,
        cancellationObservation: '   trimmed observation   ',
      });
      expect(order.cancellationObservation).toBe('trimmed observation');
    });
  });

  describe('CANCELLED status validation', () => {
    it('should throw ValidationError when CANCELLED without observation', () => {
      expect(() =>
        makeOrder({
          ...validOrderProps,
          status: OrderStatus.CANCELLED,
        })
      ).toThrow(ValidationError);
    });

    it('should throw ValidationError when CANCELLED with short observation', () => {
      expect(() =>
        makeOrder({
          ...validOrderProps,
          status: OrderStatus.CANCELLED,
          cancellationObservation: 'short',
        })
      ).toThrow(ValidationError);
    });

    it('should throw ValidationError when CANCELLED with whitespace-only observation', () => {
      expect(() =>
        makeOrder({
          ...validOrderProps,
          status: OrderStatus.CANCELLED,
          cancellationObservation: '          ',
        })
      ).toThrow(ValidationError);
    });

    it('should accept CANCELLED with valid observation', () => {
      const order = makeOrder({
        ...validOrderProps,
        status: OrderStatus.CANCELLED,
        cancellationObservation: 'Cliente solicitó cancelación por producto defectuoso',
      });
      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.cancellationObservation).toBe('Cliente solicitó cancelación por producto defectuoso');
    });

    it('should accept CANCELLED with exactly 10 character observation', () => {
      const order = makeOrder({
        ...validOrderProps,
        status: OrderStatus.CANCELLED,
        cancellationObservation: '1234567890',
      });
      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.cancellationObservation).toBe('1234567890');
    });
  });

  describe('non-CANCELLED status', () => {
    it('should not require observation for ACTIVE status', () => {
      const order = makeOrder({
        ...validOrderProps,
        status: OrderStatus.ACTIVE,
      });
      expect(order.status).toBe(OrderStatus.ACTIVE);
      expect(order.cancellationObservation).toBeUndefined();
    });

    it('should not require observation for COMPLETED status', () => {
      const order = makeOrder({
        ...validOrderProps,
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        deliveryStatus: DeliveryStatus.COMPLETE,
      });
      expect(order.status).toBe(OrderStatus.COMPLETED);
    });

    it('should accept observation for non-CANCELLED status', () => {
      const order = makeOrder({
        ...validOrderProps,
        status: OrderStatus.ACTIVE,
        cancellationObservation: 'Some note',
      });
      expect(order.cancellationObservation).toBe('Some note');
    });
  });
});
