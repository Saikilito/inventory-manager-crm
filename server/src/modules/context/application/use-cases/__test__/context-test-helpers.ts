import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { toError } from '../../../../../../../shared-domain/src/shared/error-utils.js';
import { IContext, makeContext } from '../../../../../../../shared-domain/src/context/context.entity.js';
import { IProduct, makeProduct } from '../../../../../../../shared-domain/src/product/product.entity.js';
import { IOrder, makeOrder, OrderStatus, PaymentStatus, DeliveryStatus } from '../../../../../../../shared-domain/src/order/order.entity.js';
import { IPdfReportService } from '../../services/pdf-report-service.interface.js';
import { IContextRepository } from '../../../domain/repositories/context.repository.js';
import { IProductRepository } from '../../../../product/application/repositories/product.repository.js';
import { IOrderRepository } from '../../../../order/application/repositories/order.repository.js';
import { IExpenseRepository } from '../../../../expense/application/repositories/expense.repository.js';
import { IAccountRepository } from '../../../../financial/application/repositories/financial.repository.js';

export const CONTEXT_ID = '110e8400-e29b-41d4-a716-446655440011';
export const ANOTHER_CONTEXT_ID = '110e8400-e29b-41d4-a716-446655440022';
export const PRODUCT_1_ID = '220e8400-e29b-41d4-a716-446655440001';
export const PRODUCT_2_ID = '220e8400-e29b-41d4-a716-446655440002';
export const PRODUCT_3_ID = '220e8400-e29b-41d4-a716-446655440003';
export const SELLER_ID = '330e8400-e29b-41d4-a716-446655440003';
export const CLIENT_ID = '440e8400-e29b-41d4-a716-446655440004';

export const createMockContext = (id: string = CONTEXT_ID): IContext => {
  return makeContext({
    id,
    name: 'Drinks',
    attributes: [{ name: 'liters', type: 'NUMBER', required: true }],
  });
};

export const createMockProducts = (): IProduct[] => {
  return [
    makeProduct({
      id: PRODUCT_1_ID,
      name: 'Coca Cola 2L',
      purchasePrice: 1.50,
      sellingPrice: 2.50,
      stock: 10,
      contextId: CONTEXT_ID,
    }),
    makeProduct({
      id: PRODUCT_2_ID,
      name: 'Orange Juice 1L',
      purchasePrice: 2.00,
      sellingPrice: 3.50,
      stock: 5,
      contextId: CONTEXT_ID,
    }),
    makeProduct({
      id: PRODUCT_3_ID,
      name: 'Spare Tire',
      purchasePrice: 20.00,
      sellingPrice: 40.00,
      stock: 2,
      contextId: ANOTHER_CONTEXT_ID,
    }),
  ];
};

export const createMockOrders = (): IOrder[] => {
  return [
    // Completed order 1
    makeOrder({
      id: '110e8400-e29b-41d4-a716-446655440001',
      clientId: CLIENT_ID,
      sellerId: SELLER_ID,
      status: OrderStatus.ACTIVE,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.COMPLETE,
      createdAt: '2026-06-15T10:00:00Z', // local Caracas: 2026-06-15T06:00:00.000-04:00 (Monthly: 2026-06, Weekly: 2026-W25)
      total: 12.00,
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
        { accountId: '110e8400-e29b-41d4-a716-44665544acc1', amount: 350, exchangeRate: 35.0 }, // $10 USD
        { accountId: '110e8400-e29b-41d4-a716-44665544acc2', amount: 2, exchangeRate: 1.0 }     // $2 USD
      ]
    }),
    // Completed order 2 (another month) - fallback to catalog purchasePrice (1.50)
    makeOrder({
      id: '110e8400-e29b-41d4-a716-446655440002',
      clientId: CLIENT_ID,
      sellerId: SELLER_ID,
      status: OrderStatus.ACTIVE,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.COMPLETE,
      createdAt: '2026-07-20T14:00:00Z', // local Caracas: 2026-07-20T10:00:00.000-04:00 (Monthly: 2026-07, Weekly: 2026-W30)
      total: 5.00,
      items: [
        {
          productId: PRODUCT_1_ID,
          quantity: 2,
          purchasePriceAtSale: 0.01, // Fallback trigger
          sellingPriceAtSale: 2.50,
        },
      ],
      payments: [
        { accountId: '110e8400-e29b-41d4-a716-44665544acc1', amount: 175, exchangeRate: 35.0 } // $5 USD
      ]
    }),
    // Pending order (should be ignored for historical margins)
    makeOrder({
      id: '110e8400-e29b-41d4-a716-446655440003',
      clientId: CLIENT_ID,
      sellerId: SELLER_ID,
      status: OrderStatus.CANCELLED,
      cancellationObservation: 'Cancelación solicitada por el cliente',
      paymentStatus: PaymentStatus.PENDING,
      deliveryStatus: DeliveryStatus.PENDING,
      createdAt: '2026-06-16T10:00:00Z',
      total: 2.50,
      items: [
        {
          productId: PRODUCT_1_ID,
          quantity: 1,
          purchasePriceAtSale: 1.50,
          sellingPriceAtSale: 2.50,
        },
      ],
    }),
    // Unpaid order - status active but payment pending (should be ignored for historical margins)
    makeOrder({
      id: '110e8400-e29b-41d4-a716-446655440004',
      clientId: CLIENT_ID,
      sellerId: SELLER_ID,
      status: OrderStatus.ACTIVE,
      paymentStatus: PaymentStatus.PENDING,
      deliveryStatus: DeliveryStatus.COMPLETE,
      createdAt: '2026-06-17T10:00:00Z',
      total: 2.50,
      items: [
        {
          productId: PRODUCT_1_ID,
          quantity: 1,
          purchasePriceAtSale: 1.50,
          sellingPriceAtSale: 2.50,
        },
      ],
    }),
    // Undelivered order - status active but delivery status sent (should be ignored for historical margins)
    makeOrder({
      id: '110e8400-e29b-41d4-a716-446655440005',
      clientId: CLIENT_ID,
      sellerId: SELLER_ID,
      status: OrderStatus.ACTIVE,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.SENT,
      createdAt: '2026-06-18T10:00:00Z',
      total: 2.50,
      items: [
        {
          productId: PRODUCT_1_ID,
          quantity: 1,
          purchasePriceAtSale: 1.50,
          sellingPriceAtSale: 2.50,
        },
      ],
    }),
  ];
};

export const mockContextRepository: IContextRepository = {
  getById: async (id: { toString(): string }) => {
    if (id.toString() === CONTEXT_ID || id.toString() === ANOTHER_CONTEXT_ID) {
      return Result.ok(createMockContext(id.toString()));
    }
    return Result.ok(null);
  },
  getAll: async () => Result.ok({ items: [createMockContext()], total: 1, page: 1, limit: 10, pages: 1 }),
} as unknown as IContextRepository;

export const mockProductRepository: IProductRepository = {
  getAll: async () => {
    try {
      const items = createMockProducts();
      return Result.ok({ items, total: 3, page: 1, limit: 10, pages: 1 });
    } catch (err: unknown) {
      return Result.fail(toError(err));
    }
  },
} as unknown as IProductRepository;

export const mockOrderRepository: IOrderRepository = {
  getAll: async () => {
    try {
      const items = createMockOrders();
      return Result.ok({ items, total: items.length, page: 1, limit: 10, pages: 1 });
    } catch (err: unknown) {
      return Result.fail(toError(err));
    }
  },
} as unknown as IOrderRepository;

export const mockExpenseRepository: IExpenseRepository = {
  getAll: async () => {
    return Result.ok({ items: [], total: 0, page: 1, limit: 10, pages: 0 });
  },
  dissociateByContextId: async () => {
    return Result.ok(undefined);
  },
} as unknown as IExpenseRepository;

export const mockAccountRepository: IAccountRepository = {
  getAll: async () => {
    return Result.ok({
      items: [
        { id: '110e8400-e29b-41d4-a716-44665544acc1', name: 'Banesco', currency: 'VES' },
        { id: '110e8400-e29b-41d4-a716-44665544acc2', name: 'Zelle', currency: 'USD' }
      ],
      total: 2,
      page: 1,
      limit: 10,
      pages: 1
    });
  }
} as unknown as IAccountRepository;

export const mockPdfReportService: IPdfReportService = {
  generateContextReport: async (metrics, periodType) => Buffer.from('PDF_DUMMY_DATA'),
};
