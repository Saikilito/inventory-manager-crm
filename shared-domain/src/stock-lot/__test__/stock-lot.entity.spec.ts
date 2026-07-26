import { describe, it, expect } from 'vitest';
import { makeStockLot, makeStockLotItem, calculateWeightedAveragePrice, completeStockLot } from '../stock-lot.entity.js';
import { IdVO } from '../../shared/value-objects/id.vo.js';

describe('StockLot Entity', () => {
  describe('makeStockLotItem', () => {
    it('should create a valid stock lot item', () => {
      const item = makeStockLotItem({
        productName: 'Laptop',
        quantity: 10,
        unitCost: 800,
        confirmedSellingPrice: 1200,
        isNewProduct: false,
      });

      expect(item.productName.toString()).toBe('Laptop');
      expect(Number(item.quantity)).toBe(10);
      expect(Number(item.unitCost)).toBe(800);
      expect(Number(item.confirmedSellingPrice)).toBe(1200);
      expect(item.isNewProduct).toBe(false);
      expect(Number(item.projectedProfit)).toBe(4000); // (1200 - 800) * 10
    });

    it('should throw validation error for empty product name', () => {
      expect(() =>
        makeStockLotItem({
          productName: '',
          quantity: 10,
          unitCost: 800,
          confirmedSellingPrice: 1200,
          isNewProduct: false,
        }),
      ).toThrow('Product name is required');
    });

    it('should throw validation error for negative quantity', () => {
      expect(() =>
        makeStockLotItem({
          productName: 'Laptop',
          quantity: -10,
          unitCost: 800,
          confirmedSellingPrice: 1200,
          isNewProduct: false,
        }),
      ).toThrow('Quantity must be non-negative');
    });

    it('should throw validation error for non-positive unit cost', () => {
      expect(() =>
        makeStockLotItem({
          productName: 'Laptop',
          quantity: 10,
          unitCost: 0,
          confirmedSellingPrice: 1200,
          isNewProduct: false,
        }),
      ).toThrow('Unit cost must be positive');
    });
  });

  describe('makeStockLot', () => {
    const validItems = [
      makeStockLotItem({
        productName: 'Laptop',
        quantity: 10,
        unitCost: 800,
        confirmedSellingPrice: 1200,
        isNewProduct: false,
      }),
    ];

    it('should create a valid stock lot with CASH payment', () => {
      const lot = makeStockLot({
        supplier: 'TechSupply Co',
        purchaseDate: '2026-07-23',
        items: validItems,
        paymentMethod: 'CASH',
        transactionId: '507f1f77bcf86cd799439011',
      });

      expect(lot.supplier.toString()).toBe('TechSupply Co');
      expect(lot.paymentMethod).toBe('CASH');
      expect(lot.transactionId?.toString()).toBe('507f1f77bcf86cd799439011');
      expect(lot.status).toBe('RECEIVED');
    });

    it('should create a valid stock lot with CREDIT payment', () => {
      const lot = makeStockLot({
        supplier: 'TechSupply Co',
        purchaseDate: '2026-07-23',
        items: validItems,
        paymentMethod: 'CREDIT',
        accountsPayableId: '507f1f77bcf86cd799439012',
      });

      expect(lot.paymentMethod).toBe('CREDIT');
      expect(lot.accountsPayableId?.toString()).toBe('507f1f77bcf86cd799439012');
    });

    it('should throw validation error for missing supplier', () => {
      expect(() =>
        makeStockLot({
          supplier: '',
          purchaseDate: '2026-07-23',
          items: validItems,
          paymentMethod: 'CASH',
          transactionId: 'tx-123',
        }),
      ).toThrow('Supplier name is required');
    });

    it('should throw validation error for missing transaction ID with CASH', () => {
      expect(() =>
        makeStockLot({
          supplier: 'TechSupply Co',
          purchaseDate: '2026-07-23',
          items: validItems,
          paymentMethod: 'CASH',
        }),
      ).toThrow('Transaction ID is required for CASH payment');
    });
  });

  describe('calculateWeightedAveragePrice', () => {
    it('should return lot unit cost when current stock is 0', () => {
      const result = calculateWeightedAveragePrice(0, 0, 800, 10);
      expect(result).toBe(800);
    });

    it('should calculate weighted average correctly', () => {
      const result = calculateWeightedAveragePrice(100, 20, 120, 10);
      expect(result).toBe(106.67);
    });

    it('should handle decimal precision correctly', () => {
      const result = calculateWeightedAveragePrice(750, 20, 800, 10);
      expect(result).toBe(766.67);
    });
  });

  describe('completeStockLot', () => {
    const validItems = [
      makeStockLotItem({
        productName: 'Laptop',
        quantity: 10,
        unitCost: 800,
        confirmedSellingPrice: 1200,
        isNewProduct: false,
      }),
    ];

    it('should transition a draft stock lot to RECEIVED status', () => {
      const draftLot = makeStockLot({
        supplier: 'TechSupply Co',
        purchaseDate: '2026-07-23',
        items: validItems,
        paymentMethod: 'CASH',
        status: 'DRAFT',
      });

      const txId = IdVO.create('507f1f77bcf86cd799439011');
      const completed = completeStockLot(draftLot, { transactionId: txId });

      expect(completed.status).toBe('RECEIVED');
      expect(completed.transactionId?.toString()).toBe('507f1f77bcf86cd799439011');
    });

    it('should throw error if attempting to complete a non-DRAFT stock lot', () => {
      const receivedLot = makeStockLot({
        supplier: 'TechSupply Co',
        purchaseDate: '2026-07-23',
        items: validItems,
        paymentMethod: 'CASH',
        transactionId: '507f1f77bcf86cd799439011',
        status: 'RECEIVED',
      });

      expect(() => completeStockLot(receivedLot, {})).toThrow('Only DRAFT stock lots can be completed');
    });
  });
});
