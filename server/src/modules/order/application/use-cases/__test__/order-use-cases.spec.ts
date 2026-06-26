import { describe, it, expect } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../../shared-domain/src/shared/errors.js';
import { IOrder, makeOrder, OrderStatus } from '../../../../../../../shared-domain/src/order/order.entity.js';
import { IProduct, makeProduct } from '../../../../../../../shared-domain/src/product/product.entity.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IOrderRepository } from '../../repositories/order.repository.js';
import { IProductRepository } from '../../../../product/application/repositories/product.repository.js';
import { makeGetOrder } from '../get-order.js';
import { makeGetOrderClient } from '../get-order-client.js';
import { makeGetAllOrders } from '../get-all-orders.js';
import { makeTotalOrders } from '../total-orders.js';
import { makeCreateOrder } from '../create-order.js';
import { makeUpdateOrder } from '../update-order.js';
import { makeDeleteOrder } from '../delete-order.js';

const VALID_ORDER_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_PRODUCT_UUID = '550e8400-e29b-41d4-a716-446655440001';
const VALID_CLIENT_UUID = '550e8400-e29b-41d4-a716-446655440002';
const VALID_SELLER_UUID = '550e8400-e29b-41d4-a716-446655440003';

const productMother = {
  create(overrides: Partial<{ id: string; name: string; price: number; stock: number }> = {}) {
    return makeProduct({
      id: overrides.id ?? VALID_PRODUCT_UUID,
      name: overrides.name ?? 'Coffee Beans',
      price: overrides.price ?? 10,
      stock: overrides.stock ?? 50,
    });
  }
};

const orderMother = {
  create(overrides: Partial<{ id: string; items: Array<{ productId: string; quantity: number }>; total: number; clientId: string; status: OrderStatus; sellerId: string }> = {}) {
    return makeOrder({
      id: overrides.id ?? VALID_ORDER_UUID,
      items: overrides.items ?? [{ productId: VALID_PRODUCT_UUID, quantity: 5 }],
      total: overrides.total ?? 50,
      clientId: overrides.clientId ?? VALID_CLIENT_UUID,
      status: overrides.status ?? OrderStatus.PENDING,
      sellerId: overrides.sellerId ?? VALID_SELLER_UUID,
    });
  }
};

const makeMockProductRepository = (initialProduct: IProduct): IProductRepository => {
  const store = new Map<string, IProduct>();
  store.set(initialProduct.id!, initialProduct);

  return {
    async getById(id: string): Promise<Result<IProduct | null, any>> {
      return Result.ok(store.get(id) || null);
    },
    async updateById(id: string, product: any): Promise<Result<void, any>> {
      const existing = store.get(id);
      if (!existing) return Result.fail(new DatabaseError('Product not found'));
      store.set(id, { ...existing, ...product });
      return Result.ok();
    }
  } as any;
};

const makeMockOrderRepository = (initialOrder: IOrder): IOrderRepository => {
  const store = new Map<string, IOrder>();
  store.set(initialOrder.id!, initialOrder);

  return {
    async getById(id: string): Promise<Result<IOrder | null, any>> {
      return Result.ok(store.get(id) || null);
    },
    async getAll(input?: any): Promise<Result<any, any>> {
      let list = Array.from(store.values());
      const clientField = input?.where?.fields?.find((f: any) => f.field === 'clientId');
      if (clientField) {
        list = list.filter(o => o.clientId === clientField.value);
      }
      const page = input?.page ? Number(input.page) : 1;
      const limit = input?.limit ? Number(input.limit) : 10;
      const skip = (page - 1) * limit;
      const items = list.slice(skip, skip + limit);
      const total = list.length;
      const pages = Math.ceil(total / limit);
      return Result.ok({ items, total, page, limit, pages });
    },
    async create(order: any): Promise<Result<any, any>> {
      const id = order.id || IdVO.generate();
      const saved = makeOrder({
        id,
        items: order.items,
        total: order.total,
        clientId: order.clientId,
        status: order.status,
        sellerId: order.sellerId
      });
      store.set(id, saved);
      return Result.ok(saved);
    },
    async updateById(id: string, order: any): Promise<Result<void, any>> {
      const existing = store.get(id);
      if (!existing) return Result.fail(new DatabaseError('Order not found'));
      store.set(id, { ...existing, ...order });
      return Result.ok();
    }
  } as any;
};

const dummyRecalculateRating = async () => Result.ok<void, any>();

describe('Order Use Cases (TDD)', () => {
  it('should retrieve an order by ID (GetOrder)', async () => {
    const order = orderMother.create();
    const orderRepo = makeMockOrderRepository(order);
    const getOrder = makeGetOrder(orderRepo);

    const result = await getOrder(VALID_ORDER_UUID);
    expect(result.isFailure).toBe(false);
    expect(result.getValue().clientId).toBe(VALID_CLIENT_UUID);
  });

  it('should retrieve orders by Client ID (GetOrderClient)', async () => {
    const order = orderMother.create();
    const orderRepo = makeMockOrderRepository(order);
    const getOrderClient = makeGetOrderClient(orderRepo);

    const result = await getOrderClient(VALID_CLIENT_UUID);
    expect(result.isFailure).toBe(false);
    expect(result.getValue().length).toBe(1);
  });

  it('should successfully create a new pending order (CreateOrder)', async () => {
    const order = orderMother.create();
    const orderRepo = makeMockOrderRepository(order);
    const createOrder = makeCreateOrder(orderRepo, dummyRecalculateRating as any);

    const result = await createOrder({
      items: [{ productId: VALID_PRODUCT_UUID, quantity: 10 }],
      total: 100,
      clientId: VALID_CLIENT_UUID,
      sellerId: VALID_SELLER_UUID
    });

    expect(result.isFailure).toBe(false);
    expect(result.getValue().status).toBe(OrderStatus.PENDING);

    const getAllRes = await orderRepo.getAll({ limit: 1 as any });
    const count = getAllRes.getValue().total;
    expect(count).toBe(2);
  });

  it('should successfully transition PENDING -> COMPLETED and deduct product stock', async () => {
    const product = productMother.create({ stock: 50 });
    const order = orderMother.create({ status: OrderStatus.PENDING, items: [{ productId: VALID_PRODUCT_UUID, quantity: 10 }] });

    const productRepo = makeMockProductRepository(product);
    const orderRepo = makeMockOrderRepository(order);

    const updateOrder = makeUpdateOrder(orderRepo, productRepo, dummyRecalculateRating as any);

    const result = await updateOrder({ id: VALID_ORDER_UUID, status: OrderStatus.COMPLETED });
    expect(result.isFailure).toBe(false);

    // Assert that the order is updated
    const getOrderRes = await orderRepo.getById(IdVO.create(VALID_ORDER_UUID));
    const updatedOrder = getOrderRes.getValue()!;
    expect(updatedOrder.status).toBe(OrderStatus.COMPLETED);

    // Assert that the stock was successfully deducted
    const getProductRes = await productRepo.getById(IdVO.create(VALID_PRODUCT_UUID));
    const updatedProduct = getProductRes.getValue()!;
    expect(updatedProduct.stock).toBe(40); // 50 - 10
  });

  it('should fail transition PENDING -> COMPLETED if there is insufficient stock', async () => {
    const product = productMother.create({ stock: 5 }); // Only 5 in stock!
    const order = orderMother.create({ status: OrderStatus.PENDING, items: [{ productId: VALID_PRODUCT_UUID, quantity: 10 }] }); // Ordering 10!

    const productRepo = makeMockProductRepository(product);
    const orderRepo = makeMockOrderRepository(order);

    const updateOrder = makeUpdateOrder(orderRepo, productRepo, dummyRecalculateRating as any);

    const result = await updateOrder({ id: VALID_ORDER_UUID, status: OrderStatus.COMPLETED });
    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('Insufficient stock');

    // Assert that stock remained unchanged
    const getProductRes = await productRepo.getById(IdVO.create(VALID_PRODUCT_UUID));
    const unchangedProduct = getProductRes.getValue()!;
    expect(unchangedProduct.stock).toBe(5);
  });

  it('should successfully transition COMPLETED -> CANCELLED and restock product stock', async () => {
    const product = productMother.create({ stock: 40 });
    const order = orderMother.create({ status: OrderStatus.COMPLETED, items: [{ productId: VALID_PRODUCT_UUID, quantity: 10 }] });

    const productRepo = makeMockProductRepository(product);
    const orderRepo = makeMockOrderRepository(order);

    const updateOrder = makeUpdateOrder(orderRepo, productRepo, dummyRecalculateRating as any);

    const result = await updateOrder({ id: VALID_ORDER_UUID, status: OrderStatus.CANCELLED });
    expect(result.isFailure).toBe(false);

    // Assert that the order is updated
    const getOrderRes = await orderRepo.getById(IdVO.create(VALID_ORDER_UUID));
    const updatedOrder = getOrderRes.getValue()!;
    expect(updatedOrder.status).toBe(OrderStatus.CANCELLED);

    // Assert that the stock was successfully restocked
    const getProductRes = await productRepo.getById(IdVO.create(VALID_PRODUCT_UUID));
    const updatedProduct = getProductRes.getValue()!;
    expect(updatedProduct.stock).toBe(50); // 40 + 10
  });

  it('should NOT modify product stock during PENDING -> CANCELLED transition', async () => {
    const product = productMother.create({ stock: 50 });
    const order = orderMother.create({ status: OrderStatus.PENDING, items: [{ productId: VALID_PRODUCT_UUID, quantity: 10 }] });

    const productRepo = makeMockProductRepository(product);
    const orderRepo = makeMockOrderRepository(order);

    const updateOrder = makeUpdateOrder(orderRepo, productRepo, dummyRecalculateRating as any);

    const result = await updateOrder({ id: VALID_ORDER_UUID, status: OrderStatus.CANCELLED });
    expect(result.isFailure).toBe(false);

    // Assert that stock remained 50 (since it was never deducted!)
    const getProductRes = await productRepo.getById(IdVO.create(VALID_PRODUCT_UUID));
    const updatedProduct = getProductRes.getValue()!;
    expect(updatedProduct.stock).toBe(50);
  });
});
