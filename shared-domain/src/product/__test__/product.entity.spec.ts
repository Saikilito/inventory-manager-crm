import { describe, it, expect } from 'vitest';
import { makeProduct, calculateWeightedAveragePrice } from '../product.entity.js';

describe('Product Entity', () => {
  it('should create a valid product', () => {
    const product = makeProduct({
      name: 'Test Product',
      purchasePrice: 100,
      sellingPrice: 150,
      stock: 50,
    });

    expect(product.name.toString()).toBe('Test Product');
    expect(Number(product.purchasePrice)).toBe(100);
    expect(Number(product.sellingPrice)).toBe(150);
    expect(Number(product.stock)).toBe(50);
  });

  describe('calculateWeightedAveragePrice', () => {
    it('should calculate weighted average correctly in Product domain context', () => {
      const newPrice = calculateWeightedAveragePrice(100, 20, 120, 10);
      expect(newPrice).toBe(106.67);
    });

    it('should return lot unit cost when stock is 0', () => {
      const newPrice = calculateWeightedAveragePrice(0, 0, 80, 5);
      expect(newPrice).toBe(80);
    });
  });
});
