import { describe, it, expect } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../../shared-domain/src/shared/errors.js';
import { IProduct, makeProduct } from '../../../../../../../shared-domain/src/product/product.entity.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IProductRepository } from '../../repositories/product.repository.js';
import { makeGetProduct } from '../get-product.js';
import { makeGetAllProducts } from '../get-all-products.js';
import { makeTotalProducts } from '../total-products.js';
import { makeCreateProduct } from '../create-product.js';
import { makeUpdateProduct } from '../update-product.js';
import { makeDeleteProduct } from '../delete-product.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// Setup Mock Product Mother
const productMother = {
  create(overrides: Partial<{ id: string; name: string; price: number; stock: number }> = {}) {
    return makeProduct({
      id: overrides.id ?? VALID_UUID,
      name: overrides.name ?? 'Premium Saikilo Coffee',
      price: overrides.price ?? 12.99,
      stock: overrides.stock ?? 45,
    });
  }
};

// Create fully isolated mock repository
const makeMockProductRepository = (): IProductRepository => {
  const store = new Map<string, IProduct>();
  // Pre-populate with one item
  const initial = productMother.create();
  store.set(initial.id!, initial);

  return {
    async getById(id: string): Promise<Result<IProduct | null, any>> {
      return Result.ok(store.get(id) || null);
    },

    async getAll(input?: any): Promise<Result<any, any>> {
      let list = Array.from(store.values());
      const page = input?.page ? Number(input.page) : 1;
      const limit = input?.limit ? Number(input.limit) : 10;
      const skip = (page - 1) * limit;
      const items = list.slice(skip, skip + limit);
      const total = list.length;
      const pages = Math.ceil(total / limit);
      return Result.ok({ items, total, page, limit, pages });
    },

    async create(product: any): Promise<Result<any, any>> {
      const id = product.id || IdVO.generate();
      const saved = { ...product, id };
      store.set(id, saved);
      return Result.ok(saved);
    },

    async updateById(id: string, product: any): Promise<Result<void, any>> {
      const existing = store.get(id);
      if (!existing) return Result.fail(new DatabaseError('Product not found'));
      store.set(id, { ...existing, ...product });
      return Result.ok();
    },

    async deleteByIds(ids: string[]): Promise<Result<void, any>> {
      for (const id of ids) {
        store.delete(id);
      }
      return Result.ok();
    },
  } as any;
};

describe('Product Use Cases (TDD)', () => {
  it('should retrieve a product by ID (GetProduct)', async () => {
    const repo = makeMockProductRepository();
    const getProduct = makeGetProduct(repo);

    const result = await getProduct(VALID_UUID);
    expect(result.isFailure).toBe(false);
    expect(result.getValue().name).toBe('Premium Saikilo Coffee');
  });

  it('should fail when product ID does not exist (GetProduct)', async () => {
    const repo = makeMockProductRepository();
    const getProduct = makeGetProduct(repo);

    const result = await getProduct('00000000-0000-0000-0000-000000000000'); // Valid format, non-existent
    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toBe('Product not found');
  });

  it('should retrieve all products (GetAllProducts)', async () => {
    const repo = makeMockProductRepository();
    const getAllProducts = makeGetAllProducts(repo);

    const result = await getAllProducts({});
    expect(result.isFailure).toBe(false);
    expect(result.getValue().length).toBe(1);
  });

  it('should return total count of products (TotalProducts)', async () => {
    const repo = makeMockProductRepository();
    const totalProducts = makeTotalProducts(repo);

    const result = await totalProducts();
    expect(result.isFailure).toBe(false);
    expect(result.getValue()).toBe(1);
  });

  it('should successfully create a valid product (CreateProduct)', async () => {
    const repo = makeMockProductRepository();
    const createProduct = makeCreateProduct({ productRepository: repo });

    const result = await createProduct({
      name: 'Alfajor Saikilo',
      price: 2.5,
      stock: 100
    });

    expect(result.isFailure).toBe(false);
    const getAllRes = await repo.getAll({ limit: 1 as any });
    const count = getAllRes.getValue().total;
    expect(count).toBe(2);
  });

  it('should fail to create a product with negative stock or price (CreateProduct)', async () => {
    const repo = makeMockProductRepository();
    const createProduct = makeCreateProduct({ productRepository: repo });

    // Negative price should throw a ValidationError upon Value Object creation
    const resultNegPrice = await createProduct({
      name: 'Negative Price Beer',
      price: -5.0,
      stock: 10
    });
    expect(resultNegPrice.isFailure).toBe(true);

    // Negative stock should throw a ValidationError upon Value Object creation
    const resultNegStock = await createProduct({
      name: 'Negative Stock Beer',
      price: 5.0,
      stock: -10
    });
    expect(resultNegStock.isFailure).toBe(true);
  });

  it('should successfully update partial fields of an existing product (UpdateProduct)', async () => {
    const repo = makeMockProductRepository();
    const updateProduct = makeUpdateProduct(repo);

    const result = await updateProduct({
      id: VALID_UUID,
      price: 15.00,
      stock: 50
    });

    expect(result.isFailure).toBe(false);

    const getRes = await repo.getById(IdVO.create(VALID_UUID));
    const updated = getRes.getValue()!;
    expect(updated.price).toBe(15.00);
    expect(updated.stock).toBe(50);
    expect(updated.name).toBe('Premium Saikilo Coffee'); // Kept original
  });

  it('should fail to update a product if value object rules are broken (UpdateProduct)', async () => {
    const repo = makeMockProductRepository();
    const updateProduct = makeUpdateProduct(repo);

    const result = await updateProduct({
      id: VALID_UUID,
      price: -2.00 // Broken PositiveNumberVO contract
    });

    expect(result.isFailure).toBe(true);
  });

  it('should successfully delete an existing product (DeleteProduct)', async () => {
    const repo = makeMockProductRepository();
    const deleteProduct = makeDeleteProduct(repo);

    const result = await deleteProduct(VALID_UUID);
    expect(result.isFailure).toBe(false);

    const getAllRes = await repo.getAll({ limit: 1 as any });
    const count = getAllRes.getValue().total;
    expect(count).toBe(0);
  });
});
