import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { IRentalReservation, makeRentalReservation, RentalStatus } from '../../../../../../../shared-domain/src/rental/rental.entity.js';
import { IRentalRepository } from '../../repositories/rental.repository.js';
import { IProductRepository } from '../../../../product/application/repositories/product.repository.js';
import { IProduct, makeProduct } from '../../../../../../../shared-domain/src/product/product.entity.js';
import { makeCreateRentalReservation } from '../create-rental-reservation.js';
import { makeReturnRental } from '../return-rental.js';
import { makeGetRental } from '../get-rental.js';
import { makeGetOverlappingReservations } from '../get-overlapping-reservations.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { ValidationError } from '../../../../../../../shared-domain/src/shared/validation-error.js';

const VALID_PRODUCT_UUID = '550e8400-e29b-41d4-a716-446655440001';
const VALID_ORDER_UUID = '550e8400-e29b-41d4-a716-446655440002';

const makeMockProductRepository = (): IProductRepository & { setProduct: (p: IProduct) => void } => {
  const products = new Map<string, IProduct>();

  return {
    getById: async (id) => {
      const p = products.get(id.toString());
      return Result.ok(p ? p as any : null);
    },
    setProduct: (p: IProduct) => {
      products.set(p.id!.toString(), p);
    },
    // Stubs
    create: async () => Result.ok({} as any),
    getOne: async () => Result.ok({} as any),
    getAll: async () => Result.ok({} as any),
    updateById: async () => Result.ok({} as any),
    updateByIdIf: async () => Result.ok(true),
    deleteByIds: async () => Result.ok(void 0),
  };
};

const makeMockRentalRepository = (): IRentalRepository => {
  const store = new Map<string, IRentalReservation>();

  return {
    create: async (rentalOrRentals: IRentalReservation | IRentalReservation[], createdBy?: any) => {
      if (Array.isArray(rentalOrRentals)) {
        const results = rentalOrRentals.map(r => {
          const id = r.id || IdVO.generate();
          const saved = { ...r, id };
          store.set(id.toString(), saved);
          return saved;
        });
        return Result.ok(results) as any;
      } else {
        const id = rentalOrRentals.id || IdVO.generate();
        const saved = { ...rentalOrRentals, id };
        store.set(id.toString(), saved);
        return Result.ok(saved);
      }
    },
    getById: async (id) => {
      return Result.ok(store.get(id.toString()) || null) as any;
    },
    getOne: async (where) => {
      return Result.ok(null);
    },
    getAll: async (input) => {
      let items = Array.from(store.values());
      if (input?.where?.fields) {
        for (const f of input.where.fields) {
          const fieldNames = Array.isArray(f.field) ? f.field : [f.field];
          const val = f.value;
          const op = f.operator ?? '=';

          items = items.filter(item => {
            return fieldNames.some(name => {
              const itemVal = (item as any)[name];
              const itemStr = itemVal ? itemVal.toString() : '';

              if (op === '=') {
                if (Array.isArray(val)) {
                  return val.map(String).includes(itemStr);
                }
                return itemStr === String(val);
              }
              if (op === '!=') {
                if (Array.isArray(val)) {
                  return !val.map(String).includes(itemStr);
                }
                return itemStr !== String(val);
              }
              if (op === 'NOT IN') {
                const arr = Array.isArray(val) ? val : [val];
                return !arr.map(String).includes(itemStr);
              }
              if (op === 'ILIKE') {
                return itemStr.toLowerCase().includes(String(val).toLowerCase());
              }
              if (op === '<') {
                return new Date(itemVal as any).getTime() < new Date(val as any).getTime();
              }
              if (op === '>') {
                return new Date(itemVal as any).getTime() > new Date(val as any).getTime();
              }
              return true;
            });
          });
        }
      }
      return Result.ok({
        items,
        total: items.length,
        page: 1,
        limit: 10,
        pages: 1
      }) as any;
    },
    updateById: async (id, input, updatedBy) => {
      const existing = store.get(id.toString());
      if (!existing) {
        throw new Error('Rental not found');
      }
      const updated = { ...existing, ...input };
      store.set(id.toString(), updated);
      return Result.ok(void 0);
    },
    updateByIdIf: async (id, where, input, updatedBy) => {
      const existing = store.get(id.toString());
      if (!existing) {
        return Result.ok(false);
      }
      const updated = { ...existing, ...input };
      store.set(id.toString(), updated);
      return Result.ok(true);
    },
    deleteByIds: async (ids, deletedBy) => {
      for (const id of ids) {
        store.delete(id.toString());
      }
      return Result.ok(void 0);
    }
  };
};

describe('Time-Based Rental Reservation Engine Use Cases', () => {
  let originalTz: string | undefined;

  beforeEach(() => {
    originalTz = process.env.TIMEZONE;
    process.env.TIMEZONE = 'America/Caracas';
  });

  afterEach(() => {
    if (originalTz === undefined) {
      delete process.env.TIMEZONE;
    } else {
      process.env.TIMEZONE = originalTz;
    }
  });

  it('should successfully create a rental reservation and calculate end time based on business hours', async () => {
    const productRepo = makeMockProductRepository();
    const rentalRepo = makeMockRentalRepository();

    // Create a product with total stock of 10
    const prod = makeProduct({
      id: VALID_PRODUCT_UUID,
      name: 'Concrete Mixer',
      purchasePrice: 100,
      sellingPrice: 150,
      stock: 10,
    });
    productRepo.setProduct(prod);

    const createRentalReservation = makeCreateRentalReservation(rentalRepo, productRepo);

    // Monday at 10:00 Caracas, rent for 4 hours. Ends same day at 14:00 Caracas.
    const result = await createRentalReservation({
      productId: VALID_PRODUCT_UUID,
      orderId: VALID_ORDER_UUID,
      startDateTime: '2026-06-29T14:00:00Z', // 10:00 AM Caracas
      durationHours: 4,
      quantity: 3,
    });

    expect(result.isFailure).toBe(false);
    const rental = result.getValue();
    expect(rental.productId.toString()).toBe(VALID_PRODUCT_UUID);
    expect(rental.startDateTime).toBe('2026-06-29T10:00:00.000-04:00');
    expect(rental.endDateTime).toBe('2026-06-29T14:00:00.000-04:00');
    expect(rental.quantity).toBe(3);
    expect(rental.status).toBe(RentalStatus.RESERVED);
  });

  it('should fail with ValidationError if there is insufficient stock during overlap', async () => {
    const productRepo = makeMockProductRepository();
    const rentalRepo = makeMockRentalRepository();

    // Product with total stock of 5
    const prod = makeProduct({
      id: VALID_PRODUCT_UUID,
      name: 'Drill',
      purchasePrice: 50,
      sellingPrice: 75,
      stock: 5,
    });
    productRepo.setProduct(prod);

    const createRentalReservation = makeCreateRentalReservation(rentalRepo, productRepo);

    // Reserve 3 drills on Monday 10:00 to 14:00
    const res1 = await createRentalReservation({
      productId: VALID_PRODUCT_UUID,
      orderId: VALID_ORDER_UUID,
      startDateTime: '2026-06-29T14:00:00Z',
      durationHours: 4,
      quantity: 3,
    });
    expect(res1.isFailure).toBe(false);

    // Try to reserve 3 more drills in the same overlapping interval.
    // Available stock is 5 - 3 = 2. Requested 3. Should fail.
    const res2 = await createRentalReservation({
      productId: VALID_PRODUCT_UUID,
      orderId: VALID_ORDER_UUID,
      startDateTime: '2026-06-29T15:00:00Z', // Monday 11:00 AM Caracas (overlaps)
      durationHours: 2,
      quantity: 3,
    });

    expect(res2.isFailure).toBe(true);
    expect(res2.getError()).toBeInstanceOf(ValidationError);
    expect(res2.getError().message).toContain('Insufficient stock');
  });

  it('should succeed if reservation is in a non-overlapping interval', async () => {
    const productRepo = makeMockProductRepository();
    const rentalRepo = makeMockRentalRepository();

    const prod = makeProduct({
      id: VALID_PRODUCT_UUID,
      name: 'Drill',
      purchasePrice: 50,
      sellingPrice: 75,
      stock: 5,
    });
    productRepo.setProduct(prod);

    const createRentalReservation = makeCreateRentalReservation(rentalRepo, productRepo);

    // Reserve 3 drills on Monday 10:00 to 12:00
    const res1 = await createRentalReservation({
      productId: VALID_PRODUCT_UUID,
      orderId: VALID_ORDER_UUID,
      startDateTime: '2026-06-29T14:00:00Z',
      durationHours: 2,
      quantity: 3,
    });
    expect(res1.isFailure).toBe(false);

    // Reserve 3 drills on Monday 12:00 to 14:00. Non-overlapping! Should succeed.
    const res2 = await createRentalReservation({
      productId: VALID_PRODUCT_UUID,
      orderId: VALID_ORDER_UUID,
      startDateTime: '2026-06-29T16:00:00Z', // 12:00 PM Caracas
      durationHours: 2,
      quantity: 3,
    });
    expect(res2.isFailure).toBe(false);
  });

  it('should allow reserving if previous reservation has been returned', async () => {
    const productRepo = makeMockProductRepository();
    const rentalRepo = makeMockRentalRepository();

    const prod = makeProduct({
      id: VALID_PRODUCT_UUID,
      name: 'Drill',
      purchasePrice: 50,
      sellingPrice: 75,
      stock: 5,
    });
    productRepo.setProduct(prod);

    const createRentalReservation = makeCreateRentalReservation(rentalRepo, productRepo);
    const returnRental = makeReturnRental(rentalRepo);

    // Reserve 4 drills Monday 10:00 to 14:00
    const res1 = await createRentalReservation({
      productId: VALID_PRODUCT_UUID,
      orderId: VALID_ORDER_UUID,
      startDateTime: '2026-06-29T14:00:00Z',
      durationHours: 4,
      quantity: 4,
    });
    expect(res1.isFailure).toBe(false);
    const rentalId = res1.getValue().id!;

    // Return the drills early
    const resReturn = await returnRental({ rentalId: rentalId.toString() });
    expect(resReturn.isFailure).toBe(false);
    expect(resReturn.getValue().status).toBe(RentalStatus.RETURNED);

    // Try to reserve 4 drills in the same period. Since first is returned, should succeed!
    const res2 = await createRentalReservation({
      productId: VALID_PRODUCT_UUID,
      orderId: VALID_ORDER_UUID,
      startDateTime: '2026-06-29T15:00:00Z',
      durationHours: 2,
      quantity: 4,
    });
    expect(res2.isFailure).toBe(false);
  });

  it('should block double returns', async () => {
    const productRepo = makeMockProductRepository();
    const rentalRepo = makeMockRentalRepository();

    const prod = makeProduct({
      id: VALID_PRODUCT_UUID,
      name: 'Drill',
      purchasePrice: 50,
      sellingPrice: 75,
      stock: 5,
    });
    productRepo.setProduct(prod);

    const createRentalReservation = makeCreateRentalReservation(rentalRepo, productRepo);
    const returnRental = makeReturnRental(rentalRepo);

    const res1 = await createRentalReservation({
      productId: VALID_PRODUCT_UUID,
      orderId: VALID_ORDER_UUID,
      startDateTime: '2026-06-29T14:00:00Z',
      durationHours: 2,
      quantity: 1,
    });
    const rentalId = res1.getValue().id!;

    const ret1 = await returnRental({ rentalId: rentalId.toString() });
    expect(ret1.isFailure).toBe(false);

    // Return again should fail
    const ret2 = await returnRental({ rentalId: rentalId.toString() });
    expect(ret2.isFailure).toBe(true);
    expect(ret2.getError()).toBeInstanceOf(ValidationError);
    expect(ret2.getError().message).toContain('already been returned');
  });

  it('should support querying a rental and listing overlapping ones', async () => {
    const productRepo = makeMockProductRepository();
    const rentalRepo = makeMockRentalRepository();

    const prod = makeProduct({
      id: VALID_PRODUCT_UUID,
      name: 'Drill',
      purchasePrice: 50,
      sellingPrice: 75,
      stock: 5,
    });
    productRepo.setProduct(prod);

    const createRentalReservation = makeCreateRentalReservation(rentalRepo, productRepo);
    const getRental = makeGetRental(rentalRepo);
    const getOverlapping = makeGetOverlappingReservations(rentalRepo);

    const res1 = await createRentalReservation({
      productId: VALID_PRODUCT_UUID,
      orderId: VALID_ORDER_UUID,
      startDateTime: '2026-06-29T14:00:00Z',
      durationHours: 4,
      quantity: 2,
    });
    const rentalId = res1.getValue().id!;

    // Query rental by ID
    const queryRes = await getRental(rentalId.toString());
    expect(queryRes.isFailure).toBe(false);
    expect(queryRes.getValue().quantity).toBe(2);

    // Query overlapping during Monday 11:00 to 13:00 Caracas
    const overlapsRes = await getOverlapping({
      productId: VALID_PRODUCT_UUID,
      startDateTime: '2026-06-29T15:00:00Z', // 11:00 AM Caracas
      endDateTime: '2026-06-29T17:00:00Z', // 1:00 PM Caracas
    });

    expect(overlapsRes.isFailure).toBe(false);
    expect(overlapsRes.getValue().length).toBe(1);
    expect(overlapsRes.getValue()[0].id!.toString()).toBe(rentalId.toString());
  });
});
