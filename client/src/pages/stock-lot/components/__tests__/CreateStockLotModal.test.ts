import { describe, it, expect } from 'vitest';
import { getLocalDateString, getValidLotItems } from '../CreateStockLotModal';
import type { StockLotItemInput } from '../stockLotModalTypes';

describe('CreateStockLotModal Helpers', () => {
  describe('getLocalDateString', () => {
    it('returns a formatted YYYY-MM-DD string', () => {
      const dateStr = getLocalDateString(new Date('2026-07-26T12:00:00Z'));
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getValidLotItems', () => {
    it('filters out invalid items and returns valid ones', () => {
      const items: StockLotItemInput[] = [
        {
          productName: '  Item 1  ',
          quantity: '5',
          unitCost: '10',
          confirmedSellingPrice: '15',
          isNewProduct: false,
          selectedProductId: 'prod-1',
        },
        {
          productName: 'Invalid Item 1',
          quantity: '0',
          unitCost: '10',
          confirmedSellingPrice: '15',
          isNewProduct: false,
          selectedProductId: '',
        },
        {
          productName: '',
          quantity: '5',
          unitCost: '10',
          confirmedSellingPrice: '15',
          isNewProduct: false,
          selectedProductId: '',
        },
      ];

      const valid = getValidLotItems(items);
      expect(valid).toHaveLength(1);
      expect(valid[0].productName).toBe('  Item 1  ');
    });
  });
});
