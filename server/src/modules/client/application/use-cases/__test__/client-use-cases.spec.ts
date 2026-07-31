import { describe, it, expect } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError, createDatabaseError } from '../../../../../../../shared-domain/src/shared/errors.js';
import { IClient, makeClient, calculateClientRatingTier, ClientRatingTier } from '../../../../../../../shared-domain/src/client/client.entity.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IClientRepository } from '../../repositories/client.repository.js';
import { makeGetClient } from '../get-client.js';
import { makeGetAllClients } from '../get-all-clients.js';
import { makeTotalClients } from '../total-clients.js';
import { makeCreateClient } from '../create-client.js';
import { makeUpdateClient } from '../update-client.js';
import { makeDeleteClient } from '../delete-client.js';
import { makeRecalculateClientRating } from '../recalculate-client-rating.js';

const VALID_CLIENT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_SELLER_UUID = '550e8400-e29b-41d4-a716-446655440001';
const NON_EXISTENT_UUID = '550e8400-e29b-41d4-a716-446655440002';

const clientMother = {
  create(overrides: Partial<{ id: string; firstName: string; lastName: string; address: string; whatsapp: string; nationalId?: string; type: string; orders: string[]; sellerId: string }> = {}) {
    return makeClient({
      id: overrides.id ?? VALID_CLIENT_UUID,
      firstName: overrides.firstName ?? 'Kember',
      lastName: overrides.lastName ?? 'Nieves',
      address: overrides.address ?? '123 Main St',
      whatsapp: overrides.whatsapp ?? '+123456789',
      nationalId: overrides.nationalId ?? 'V-12345678',
      type: overrides.type ?? ClientRatingTier.PREMIUM,
      orders: overrides.orders ?? [],
      sellerId: overrides.sellerId ?? VALID_SELLER_UUID,
    });
  }
};

const makeMockClientRepository = () => {
  const store = new Map<string, IClient>();
  const initial = clientMother.create();
  store.set(initial.id!, initial);

  return {
    getStore() {
      return store;
    },

    async getById(id: string): Promise<Result<IClient | null, any>> {
      return Result.ok(store.get(id) || null);
    },

    async getAll(input?: any): Promise<Result<any, any>> {
      let list = Array.from(store.values());
      const sellerField = input?.where?.fields?.find((f: any) => f.field === 'sellerId');
      if (sellerField) {
        list = list.filter(c => c.sellerId === sellerField.value);
      }
      const page = input?.page ? Number(input.page) : 1;
      const limit = input?.limit ? Number(input.limit) : 10;
      const skip = (page - 1) * limit;
      const items = list.slice(skip, skip + limit);
      const total = list.length;
      const pages = Math.ceil(total / limit);
      return Result.ok({ items, total, page, limit, pages });
    },

    async create(client: any): Promise<Result<any, any>> {
      const id = client.id || IdVO.generate();
      const saved = { ...client, id };
      store.set(id, saved);
      return Result.ok(saved);
    },

    async updateById(id: string, client: any): Promise<Result<void, any>> {
      const existing = store.get(id);
      if (!existing) return Result.fail(createDatabaseError('Client not found'));
      store.set(id, { ...existing, ...client });
      return Result.ok();
    },

    async deleteByIds(ids: string[]): Promise<Result<void, any>> {
      for (const id of ids) {
        store.delete(id);
      }
      return Result.ok();
    },
  };
};

describe('Client Use Cases (TDD)', () => {
  it('should retrieve a client by ID (GetClient)', async () => {
    const repo = makeMockClientRepository();
    const getClient = makeGetClient(repo as any);

    const result = await getClient(VALID_CLIENT_UUID);
    expect(result.isFailure).toBe(false);
    expect(result.getValue().firstName).toBe('Kember');
  });

  it('should fail when client ID does not exist (GetClient)', async () => {
    const repo = makeMockClientRepository();
    const getClient = makeGetClient(repo as any);

    const result = await getClient('00000000-0000-4000-a000-000000000000');
    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('Client not found');
  });

  it('should retrieve all clients (GetAllClients)', async () => {
    const repo = makeMockClientRepository();
    const getAllClients = makeGetAllClients(repo as any);

    const result = await getAllClients({});
    expect(result.isFailure).toBe(false);
    expect(result.getValue().length).toBe(1);
  });

  it('should retrieve clients filtered by sellerId (GetAllClients)', async () => {
    const repo = makeMockClientRepository();
    const getAllClients = makeGetAllClients(repo as any);

    const resultMatched = await getAllClients({ sellerId: VALID_SELLER_UUID });
    expect(resultMatched.getValue().length).toBe(1);

    const resultEmpty = await getAllClients({ sellerId: NON_EXISTENT_UUID });
    expect(resultEmpty.getValue().length).toBe(0);
  });

  it('should return total count of clients (TotalClients)', async () => {
    const repo = makeMockClientRepository();
    const totalClients = makeTotalClients(repo as any);

    const result = await totalClients({});
    expect(result.isFailure).toBe(false);
    expect(result.getValue()).toBe(1);
  });

  it('should return total count of clients filtered by sellerId (TotalClients)', async () => {
    const repo = makeMockClientRepository();
    const totalClients = makeTotalClients(repo as any);

    const resultMatched = await totalClients({ sellerId: VALID_SELLER_UUID });
    expect(resultMatched.getValue()).toBe(1);

    const resultEmpty = await totalClients({ sellerId: NON_EXISTENT_UUID });
    expect(resultEmpty.getValue()).toBe(0);
  });

  it('should successfully create a valid client (CreateClient)', async () => {
    const repo = makeMockClientRepository();
    const createClient = makeCreateClient(repo as any);

    const result = await createClient({
      firstName: 'Lionel',
      lastName: 'Messi',
      address: 'Miami Florida',
      whatsapp: '+999999999',
      nationalId: 'V-88888888',
      sellerId: VALID_SELLER_UUID,
    });

    expect(result.isFailure).toBe(false);
    const getAllRes = await repo.getAll({ limit: 1 as any });
    const count = getAllRes.getValue().total;
    expect(count).toBe(2);
  });

  it('should fail to create a client with empty first name (CreateClient)', async () => {
    const repo = makeMockClientRepository();
    const createClient = makeCreateClient(repo as any);

    const resultEmptyName = await createClient({
      firstName: '',
      lastName: 'Messi',
      address: 'Miami Florida',
      whatsapp: '+999999999',
      nationalId: 'V-88888888',
      sellerId: VALID_SELLER_UUID,
    });
    expect(resultEmptyName.isFailure).toBe(true);
  });

  it('should successfully update partial fields of an existing client (UpdateClient)', async () => {
    const repo = makeMockClientRepository();
    const updateClient = makeUpdateClient(repo as any);

    const result = await updateClient({
      id: VALID_CLIENT_UUID,
      address: 'New Address St.',
    });

    expect(result.isFailure).toBe(false);

    const getRes = await repo.getById(VALID_CLIENT_UUID);
    const updated = getRes.getValue()!;
    expect(updated.address).toBe('New Address St.');
    expect(updated.firstName).toBe('Kember');
  });

  it('should successfully delete an existing client (DeleteClient)', async () => {
    const repo = makeMockClientRepository();
    const deleteClient = makeDeleteClient(repo as any);

    const result = await deleteClient(VALID_CLIENT_UUID);
    expect(result.isFailure).toBe(false);

    const getAllRes = await repo.getAll({ limit: 1 as any });
    const count = getAllRes.getValue().total;
    expect(count).toBe(0);
  });

  describe('calculateClientRatingTier (Unit)', () => {
    it('should return BASIC for < 3 completed orders', () => {
      expect(calculateClientRatingTier(0)).toBe(ClientRatingTier.BASIC);
      expect(calculateClientRatingTier(1)).toBe(ClientRatingTier.BASIC);
      expect(calculateClientRatingTier(2)).toBe(ClientRatingTier.BASIC);
    });

    it('should return CONCURRENT for 3 to 10 completed orders', () => {
      expect(calculateClientRatingTier(3)).toBe(ClientRatingTier.CONCURRENT);
      expect(calculateClientRatingTier(5)).toBe(ClientRatingTier.CONCURRENT);
      expect(calculateClientRatingTier(10)).toBe(ClientRatingTier.CONCURRENT);
    });

    it('should return PREMIUM for >= 11 completed orders', () => {
      expect(calculateClientRatingTier(11)).toBe(ClientRatingTier.PREMIUM);
      expect(calculateClientRatingTier(50)).toBe(ClientRatingTier.PREMIUM);
    });
  });

  describe('recalculateClientRating (Integration)', () => {
    it('should update client rating to CONCURRENT when client reaches 3 completed orders', async () => {
      const repo = makeMockClientRepository();
      const initialClient = clientMother.create({ id: VALID_CLIENT_UUID, type: ClientRatingTier.BASIC });
      repo.getStore().set(VALID_CLIENT_UUID, initialClient);

      const orders = [
        { id: '1', status: 'ACTIVE', paymentStatus: 'PAID', deliveryStatus: 'COMPLETE', clientId: VALID_CLIENT_UUID },
        { id: '2', status: 'ACTIVE', paymentStatus: 'PAID', deliveryStatus: 'COMPLETE', clientId: VALID_CLIENT_UUID },
        { id: '3', status: 'ACTIVE', paymentStatus: 'PAID', deliveryStatus: 'COMPLETE', clientId: VALID_CLIENT_UUID },
      ];

      const mockOrderRepo = {
        async getAll() {
          return Result.ok({ items: orders, total: orders.length });
        }
      } as any;

      const recalculateClientRating = makeRecalculateClientRating(repo as any, mockOrderRepo);
      const result = await recalculateClientRating(VALID_CLIENT_UUID);

      expect(result.isFailure).toBe(false);
      const updatedRes = await repo.getById(VALID_CLIENT_UUID);
      expect(updatedRes.getValue()?.type).toBe(ClientRatingTier.CONCURRENT);
    });
  });
});
