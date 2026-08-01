import { describe, it, expect } from 'vitest';
import { DeliveryMethod } from '../../../delivery/delivery-method.js';
import { DeliveryMethodVO } from '../delivery-method.vo.js';
import { ValidationError } from '../../validation-error.js';

describe('DeliveryMethodVO', () => {
  it('should create valid delivery methods for uppercase inputs', () => {
    const pickup = DeliveryMethodVO.create('PICKUP');
    expect(pickup).toBe(DeliveryMethod.PICKUP);
    expect(DeliveryMethodVO.isPickup(pickup)).toBe(true);
    expect(DeliveryMethodVO.isDelivery(pickup)).toBe(false);

    const delivery = DeliveryMethodVO.create('DELIVERY');
    expect(delivery).toBe(DeliveryMethod.DELIVERY);
    expect(DeliveryMethodVO.isDelivery(delivery)).toBe(true);
    expect(DeliveryMethodVO.isPickup(delivery)).toBe(false);
  });

  it('should create valid delivery methods for lowercase inputs (pickup, delivery)', () => {
    const pickupResult = DeliveryMethodVO.createResult('pickup');
    expect(pickupResult.isFailure).toBe(false);
    expect(pickupResult.getValue()).toBe(DeliveryMethod.PICKUP);
    expect(DeliveryMethodVO.isPickup('pickup')).toBe(true);

    const deliveryResult = DeliveryMethodVO.createResult('delivery');
    expect(deliveryResult.isFailure).toBe(false);
    expect(deliveryResult.getValue()).toBe(DeliveryMethod.DELIVERY);
    expect(DeliveryMethodVO.isDelivery('delivery')).toBe(true);
  });

  it('should fail creation for invalid strings and non-strings', () => {
    const invalidResult = DeliveryMethodVO.createResult('INVALID');
    expect(invalidResult.isFailure).toBe(true);
    expect(invalidResult.getError()).toBeInstanceOf(ValidationError);

    expect(() => DeliveryMethodVO.create('drone')).toThrow(ValidationError);

    // @ts-expect-error testing invalid type
    const nonStringResult = DeliveryMethodVO.createResult(123);
    expect(nonStringResult.isFailure).toBe(true);
  });

  it('should check equality correctly', () => {
    const pickup1 = DeliveryMethodVO.create('PICKUP');
    const pickup2 = DeliveryMethodVO.create('pickup');
    const delivery = DeliveryMethodVO.create('DELIVERY');

    expect(DeliveryMethodVO.equals(pickup1, pickup2)).toBe(true);
    expect(DeliveryMethodVO.equals(pickup1, delivery)).toBe(false);
    expect(DeliveryMethodVO.equals('pickup', 'PICKUP')).toBe(true);
  });
});
