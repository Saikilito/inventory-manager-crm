import { describe, it, expect } from 'vitest';
import { calculateContextMetrics } from '../context-metrics-calculator.js';
import { IProduct } from '../../../../../../../shared-domain/src/product/product.entity.js';
import { IOrder, OrderStatus, PaymentStatus, DeliveryStatus } from '../../../../../../../shared-domain/src/order/order.entity.js';
import { IExpense } from '../../../../../../../shared-domain/src/expense/expense.entity.js';
import { IAccount } from '../../../../../../../shared-domain/src/financial/account.entity.js';

const CONTEXT_ID = '110e8400-e29b-41d4-a716-446655440011';
const PRODUCT_1_ID = '220e8400-e29b-41d4-a716-446655440001';
const PRODUCT_2_ID = '220e8400-e29b-41d4-a716-446655440002';

describe('ContextMetricsCalculator (Pure Domain Service)', () => {
  it('should calculate metrics for a given set of products, orders, expenses, and accounts', () => {
    const products: IProduct[] = [
      {
        id: PRODUCT_1_ID,
        name: 'Coca Cola 2L',
        purchasePrice: 1.50,
        sellingPrice: 2.50,
        stock: 10,
        contextId: CONTEXT_ID,
        createdAt: '2026-06-15T10:00:00Z',
      },
      {
        id: PRODUCT_2_ID,
        name: 'Orange Juice 1L',
        purchasePrice: 2.00,
        sellingPrice: 3.50,
        stock: 5,
        contextId: CONTEXT_ID,
        createdAt: '2026-06-15T10:00:00Z',
      }
    ];

    const orders: IOrder[] = [
      {
        id: 'order-1',
        clientId: 'client-1',
        sellerId: 'seller-1',
        status: OrderStatus.ACTIVE,
        paymentStatus: PaymentStatus.PAID,
        deliveryStatus: DeliveryStatus.COMPLETE,
        createdAt: '2026-06-15T10:00:00Z',
        total: 11.00,
        items: [
          {
            productId: PRODUCT_1_ID,
            quantity: 3,
            purchasePriceAtSale: 1.50,
            sellingPriceAtSale: 2.50,
          },
          {
            productId: PRODUCT_2_ID,
            quantity: 1,
            purchasePriceAtSale: 2.00,
            sellingPriceAtSale: 3.50,
          },
        ],
        payments: [
          { accountId: 'acc-1', amount: 350, exchangeRate: 35.0 }, // $10 USD
          { accountId: 'acc-2', amount: 2, exchangeRate: 1.0 }     // $2 USD
        ]
      }
    ];

    const expenses: IExpense[] = [];

    const accounts: IAccount[] = [
      { id: 'acc-1', name: 'Banesco', currency: 'VES', isActive: true, balance: 1000 },
      { id: 'acc-2', name: 'Zelle', currency: 'USD', isActive: true, balance: 500 }
    ];

    const metrics = calculateContextMetrics({
      products,
      orders,
      expenses,
      accounts,
      contextId: CONTEXT_ID,
    });

    expect(metrics.totalStock).toBe(15);
    expect(metrics.investedCapital).toBe(25);
    expect(metrics.potentialRevenue).toBe(42.5);
    expect(metrics.potentialMargin).toBe(17.5);

    expect(metrics.totalRevenue).toBe(11.00);
    expect(metrics.totalCOGS).toBe(6.5); // (3 * 1.5) + (1 * 2.0) = 4.5 + 2 = 6.5
    expect(metrics.netProfit).toBe(4.5); // 11.0 - 6.5 - 0 = 4.5

    expect(metrics.accountDistribution.length).toBe(2);
    expect(metrics.accountDistribution[0].accountId).toBe('acc-1');
    expect(metrics.accountDistribution[0].totalReceivedUsd).toBe(10);
    expect(metrics.accountDistribution[1].accountId).toBe('acc-2');
    expect(metrics.accountDistribution[1].totalReceivedUsd).toBe(2);
    expect(metrics.favoriteAccountName).toBe('Banesco');
  });

  it('should count PAID orders regardless of status (PENDING or ACTIVE) - money in hand', () => {
    // This tests the key business rule: PAID = money in hand
    // Status (PENDING/ACTIVE) is logistics, not finance
    const products: IProduct[] = [
      {
        id: PRODUCT_1_ID,
        name: 'Coca Cola 2L',
        purchasePrice: 1.50,
        sellingPrice: 2.50,
        stock: 10,
        contextId: CONTEXT_ID,
        createdAt: '2026-06-15T10:00:00Z',
      }
    ];

    // Order is PAID but still in PENDING status (default for new orders)
    const orders: IOrder[] = [
      {
        id: 'order-1',
        clientId: 'client-1',
        sellerId: 'seller-1',
        status: OrderStatus.PENDING, // NOT ACTIVE - just created, default status
        paymentStatus: PaymentStatus.PAID,
        deliveryStatus: DeliveryStatus.PENDING,
        createdAt: '2026-06-15T10:00:00Z',
        total: 5.00,
        items: [
          {
            productId: PRODUCT_1_ID,
            quantity: 2,
            purchasePriceAtSale: 1.50,
            sellingPriceAtSale: 2.50,
          },
        ],
        payments: []
      }
    ];

    const metrics = calculateContextMetrics({
      products,
      orders,
      expenses: [],
      accounts: [],
      contextId: CONTEXT_ID,
    });

    // Revenue and profit should still be counted because order is PAID
    // Status being PENDING doesn't matter for financial metrics
    expect(metrics.totalRevenue).toBe(5.00);
    expect(metrics.totalCOGS).toBe(3.0); // 2 * 1.5
    expect(metrics.netProfit).toBe(2.0); // 5.0 - 3.0
  });

  it('should NOT count CANCELLED orders even if PAID (transaction reversed)', () => {
    const products: IProduct[] = [
      {
        id: PRODUCT_1_ID,
        name: 'Coca Cola 2L',
        purchasePrice: 1.50,
        sellingPrice: 2.50,
        stock: 10,
        contextId: CONTEXT_ID,
        createdAt: '2026-06-15T10:00:00Z',
      }
    ];

    // Order is PAID but CANCELLED - should NOT count
    const orders: IOrder[] = [
      {
        id: 'order-1',
        clientId: 'client-1',
        sellerId: 'seller-1',
        status: OrderStatus.CANCELLED, // CANCELLED!
        paymentStatus: PaymentStatus.PAID,
        deliveryStatus: DeliveryStatus.PENDING,
        createdAt: '2026-06-15T10:00:00Z',
        total: 5.00,
        items: [
          {
            productId: PRODUCT_1_ID,
            quantity: 2,
            purchasePriceAtSale: 1.50,
            sellingPriceAtSale: 2.50,
          },
        ],
        payments: []
      }
    ];

    const metrics = calculateContextMetrics({
      products,
      orders,
      expenses: [],
      accounts: [],
      contextId: CONTEXT_ID,
    });

    // Should be 0 because order is CANCELLED
    expect(metrics.totalRevenue).toBe(0);
    expect(metrics.totalCOGS).toBe(0);
    expect(metrics.netProfit).toBe(0);
  });
});
