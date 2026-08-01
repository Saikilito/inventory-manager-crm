import { describe, it, expect } from 'vitest';
import {
  PURCHASE_PRICE_FALLBACK_RATIO,
  calculateItemsSubtotal,
  calculateOrderTotal,
  resolvePurchasePrice,
} from '../order-totals.js';

describe('calculateItemsSubtotal', () => {
  it('sums quantity * unitPrice across all items', () => {
    const subtotal = calculateItemsSubtotal([
      { quantity: 2, unitPrice: 10 },
      { quantity: 3, unitPrice: 5 },
    ]);
    expect(subtotal).toBe(35);
  });

  it('returns 0 for an empty items array', () => {
    expect(calculateItemsSubtotal([])).toBe(0);
  });
});

describe('calculateOrderTotal', () => {
  it('adds the delivery fee to the subtotal', () => {
    expect(calculateOrderTotal(100, 5)).toBe(105);
  });

  it('returns the subtotal unchanged when delivery fee is 0', () => {
    expect(calculateOrderTotal(100, 0)).toBe(100);
  });
});

describe('resolvePurchasePrice', () => {
  it('returns the provided purchase price when defined', () => {
    expect(resolvePurchasePrice(12, 20)).toBe(12);
  });

  it('falls back to sellingPrice * PURCHASE_PRICE_FALLBACK_RATIO when undefined', () => {
    expect(resolvePurchasePrice(undefined, 20)).toBe(20 * PURCHASE_PRICE_FALLBACK_RATIO);
  });

  it('falls back when purchasePrice is NaN', () => {
    expect(resolvePurchasePrice(NaN, 10)).toBe(10 * PURCHASE_PRICE_FALLBACK_RATIO);
  });
});
