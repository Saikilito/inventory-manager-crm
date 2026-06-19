import { describe, it, expect } from 'vitest';
import { makeContainer } from '../container.js';

describe('Dependency Container', () => {
  it('should instantiate the default container with product, user, client, order and dashboard use cases', () => {
    const container = makeContainer();
    expect(container).toBeDefined();

    expect(container.product.getProduct).toBeTypeOf('function');
    expect(container.product.getAllProducts).toBeTypeOf('function');
    expect(container.product.totalProducts).toBeTypeOf('function');
    expect(container.product.createProduct).toBeTypeOf('function');
    expect(container.product.updateProduct).toBeTypeOf('function');
    expect(container.product.deleteProduct).toBeTypeOf('function');

    expect(container.user.getUserByEmail).toBeTypeOf('function');
    expect(container.user.registerUser).toBeTypeOf('function');
    expect(container.user.authenticateUser).toBeTypeOf('function');

    expect(container.client.getClient).toBeTypeOf('function');
    expect(container.client.getAllClients).toBeTypeOf('function');
    expect(container.client.totalClients).toBeTypeOf('function');
    expect(container.client.createClient).toBeTypeOf('function');
    expect(container.client.updateClient).toBeTypeOf('function');
    expect(container.client.deleteClient).toBeTypeOf('function');

    expect(container.order.getOrder).toBeTypeOf('function');
    expect(container.order.getOrderClient).toBeTypeOf('function');
    expect(container.order.getAllOrders).toBeTypeOf('function');
    expect(container.order.totalOrders).toBeTypeOf('function');
    expect(container.order.createOrder).toBeTypeOf('function');
    expect(container.order.updateOrder).toBeTypeOf('function');
    expect(container.order.deleteOrder).toBeTypeOf('function');

    expect(container.dashboard.getTopClients).toBeTypeOf('function');
    expect(container.dashboard.getTopSellers).toBeTypeOf('function');
  });

  it('should return a frozen, immutable container object', () => {
    const container = makeContainer();
    expect(Object.isFrozen(container)).toBe(true);

    expect(() => {
      (container as any).product = {};
    }).toThrow();
  });
});
