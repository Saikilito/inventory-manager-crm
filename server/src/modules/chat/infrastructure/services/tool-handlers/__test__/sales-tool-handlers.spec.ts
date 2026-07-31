import { describe, expect, it, vi } from 'vitest';
import { Result } from '../../../../../../../../shared-domain/src/shared/result.js';
import { makeProduct } from '../../../../../../../../shared-domain/src/product/product.entity.js';
import { IdVO } from '../../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { handleCreateClient } from '../create-client.handler.js';
import { handleCreateOrder } from '../create-order.handler.js';
import { handleSearchStock } from '../search-stock.handler.js';
import type { ToolDispatcherDependencies } from '../../types.js';

const PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440001';
const CLIENT_ID = '550e8400-e29b-41d4-a716-446655440002';
const SELLER_ID = '550e8400-e29b-41d4-a716-446655440003';

describe('Sales tool handlers', () => {
  it('returns the created client ID', async () => {
    const dependencies = {
      getDefaultSellerId: vi.fn().mockResolvedValue(SELLER_ID),
      createClient: vi.fn().mockResolvedValue(Result.ok({ id: IdVO.create(CLIENT_ID) })),
    } as unknown as ToolDispatcherDependencies;

    const result = await handleCreateClient({
      firstName: 'Ada', lastName: 'Lovelace', address: 'Caracas',
      whatsapp: '+584121234567', nationalId: 'V-12345678',
    }, '+584121234567', dependencies);

    expect(result).toMatchObject({ success: true, clientId: CLIENT_ID });
  });

  it('rejects createClient args with missing or invalid fields before touching dependencies', async () => {
    const createClient = vi.fn();
    const dependencies = {
      getDefaultSellerId: vi.fn().mockResolvedValue(SELLER_ID),
      createClient,
    } as unknown as ToolDispatcherDependencies;

    const result = await handleCreateClient({
      firstName: '', lastName: 'Lovelace', address: 'Caracas',
      whatsapp: 'not-a-whatsapp-id', nationalId: 'invalid-cedula',
    }, '+584121234567', dependencies);

    expect(result.error).toBe('Invalid createClient arguments');
    expect(result.detail).toBeDefined();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('computes authoritative product and delivery totals before creating an order', async () => {
    const product = makeProduct({
      id: PRODUCT_ID, name: 'Brake Pad', purchasePrice: 4, sellingPrice: 10, stock: 5,
    });
    const createOrder = vi.fn().mockResolvedValue(Result.ok({ id: IdVO.generate(), total: 23 }));
    const dependencies = {
      getDefaultSellerId: vi.fn().mockResolvedValue(SELLER_ID),
      productRepository: { getById: vi.fn().mockResolvedValue(Result.ok(product)) },
      createOrder,
    } as unknown as ToolDispatcherDependencies;

    const result = await handleCreateOrder({
      clientId: CLIENT_ID,
      items: [{ productId: PRODUCT_ID, quantity: 2 }],
      deliveryCost: 3,
    }, '+584121234567', dependencies);

    expect(result.total).toBe(23);
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ total: 23, deliveryCost: 3 }));
  });

  it('preserves compatibility and context filters in relaxed stock search', async () => {
    const product = makeProduct({
      id: PRODUCT_ID, name: 'Brake Pad', purchasePrice: 4, sellingPrice: 10, stock: 5,
    });
    const searchByTokens = vi.fn()
      .mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 10, pages: 0 })
      .mockResolvedValueOnce({ items: [product], total: 1, page: 1, limit: 10, pages: 1 });
    const dependencies = {
      productRepository: { searchByTokens },
      logUnsatisfiedDemand: vi.fn(),
    } as unknown as ToolDispatcherDependencies;

    await handleSearchStock({
      query: 'brake pad', contextId: CLIENT_ID, motoBrand: 'Empire', motoModel: 'TX 200', partBrand: 'TRD',
    }, '+584121234567', dependencies);

    expect(searchByTokens).toHaveBeenNthCalledWith(2, expect.objectContaining({
      contextId: CLIENT_ID, motoBrand: 'Empire', motoModel: 'TX 200', partBrand: 'TRD', nameTokens: ['brake'],
    }));
  });
});
