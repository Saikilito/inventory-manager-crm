import { describe, it, expect } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../../shared-domain/src/shared/errors.js';
import { IClient, makeClient } from '../../../../../../../shared-domain/src/client/client.entity.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IClientRepository } from '../../repositories/client.repository.js';
import { makeGetClient } from '../get-client.js';
import { makeGetAllClients } from '../get-all-clients.js';
import { makeTotalClients } from '../total-clients.js';
import { makeCreateClient } from '../create-client.js';
import { makeUpdateClient } from '../update-client.js';
import { makeDeleteClient } from '../delete-client.js';

const VALID_CLIENT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_SELLER_UUID = '550e8400-e29b-41d4-a716-446655440001';
const NON_EXISTENT_UUID = '550e8400-e29b-41d4-a716-446655440002';

// Setup Mock Client Mother
const clientMother = {
  create(overrides: Partial<{ id: string; firstName: string; lastName: string; company: string; emails: string[]; age?: number; type: string; orders: string[]; sellerId: string }> = {}) {
    return makeClient({
      id: overrides.id ?? VALID_CLIENT_UUID,
      firstName: overrides.firstName ?? 'Kember',
      lastName: overrides.lastName ?? 'Nieves',
      company: overrides.company ?? 'Saikilo Inc.',
      emails: overrides.emails ?? ['kember@example.com'],
      age: overrides.age ?? 28,
      type: overrides.type ?? 'PREMIUM',
      orders: overrides.orders ?? [],
      sellerId: overrides.sellerId ?? VALID_SELLER_UUID,
    });
  }
};

// Create fully isolated mock repository
const makeMockClientRepository = (): IClientRepository => {
  const store = new Map<string, IClient>();
  const initial = clientMother.create();
  store.set(initial.id!, initial);

  return {
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
      if (!existing) return Result.fail(new DatabaseError('Client not found'));
      store.set(id, { ...existing, ...client });
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

describe('Client Use Cases (TDD)', () => {
  it('should retrieve a client by ID (GetClient)', async () => {
    const repo = makeMockClientRepository();
    const getClient = makeGetClient(repo);

    const result = await getClient(VALID_CLIENT_UUID);
    expect(result.isFailure).toBe(false);
    expect(result.getValue().firstName).toBe('Kember');
  });

  it('should fail when client ID does not exist (GetClient)', async () => {
    const repo = makeMockClientRepository();
    const getClient = makeGetClient(repo);

    const result = await getClient('00000000-0000-4000-a000-000000000000'); // Valid UUID format, nonexistent
    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toBe('Client not found');
  });

  it('should retrieve all clients (GetAllClients)', async () => {
    const repo = makeMockClientRepository();
    const getAllClients = makeGetAllClients(repo);

    const result = await getAllClients({});
    expect(result.isFailure).toBe(false);
    expect(result.getValue().length).toBe(1);
  });

  it('should retrieve clients filtered by sellerId (GetAllClients)', async () => {
    const repo = makeMockClientRepository();
    const getAllClients = makeGetAllClients(repo);

    const resultMatched = await getAllClients({ sellerId: VALID_SELLER_UUID });
    expect(resultMatched.getValue().length).toBe(1);

    const resultEmpty = await getAllClients({ sellerId: NON_EXISTENT_UUID });
    expect(resultEmpty.getValue().length).toBe(0);
  });

  it('should return total count of clients (TotalClients)', async () => {
    const repo = makeMockClientRepository();
    const totalClients = makeTotalClients(repo);

    const result = await totalClients({});
    expect(result.isFailure).toBe(false);
    expect(result.getValue()).toBe(1);
  });

  it('should return total count of clients filtered by sellerId (TotalClients)', async () => {
    const repo = makeMockClientRepository();
    const totalClients = makeTotalClients(repo);

    const resultMatched = await totalClients({ sellerId: VALID_SELLER_UUID });
    expect(resultMatched.getValue()).toBe(1);

    const resultEmpty = await totalClients({ sellerId: NON_EXISTENT_UUID });
    expect(resultEmpty.getValue()).toBe(0);
  });

  it('should successfully create a valid client (CreateClient)', async () => {
    const repo = makeMockClientRepository();
    const createClient = makeCreateClient(repo);

    const result = await createClient({
      firstName: 'Lionel',
      lastName: 'Messi',
      company: 'Inter Miami',
      emails: ['leomessi@example.com'],
      age: 39,
      type: 'PREMIUM',
      sellerId: VALID_SELLER_UUID,
    });

    expect(result.isFailure).toBe(false);
    const getAllRes = await repo.getAll({ limit: 1 as any });
    const count = getAllRes.getValue().total;
    expect(count).toBe(2);
  });

  it('should fail to create a client with negative age or empty first name (CreateClient)', async () => {
    const repo = makeMockClientRepository();
    const createClient = makeCreateClient(repo);

    // Negative age should throw a ValidationError upon Value Object creation
    const resultNegAge = await createClient({
      firstName: 'Lionel',
      lastName: 'Messi',
      company: 'Inter Miami',
      emails: ['leomessi@example.com'],
      age: -5,
      type: 'PREMIUM',
      sellerId: VALID_SELLER_UUID,
    });
    expect(resultNegAge.isFailure).toBe(true);

    // Empty first name should throw a ValidationError upon Value Object creation
    const resultEmptyName = await createClient({
      firstName: '',
      lastName: 'Messi',
      company: 'Inter Miami',
      emails: ['leomessi@example.com'],
      type: 'PREMIUM',
      sellerId: VALID_SELLER_UUID,
    });
    expect(resultEmptyName.isFailure).toBe(true);
  });

  it('should successfully update partial fields of an existing client (UpdateClient)', async () => {
    const repo = makeMockClientRepository();
    const updateClient = makeUpdateClient(repo);

    const result = await updateClient({
      id: VALID_CLIENT_UUID,
      company: 'New Saikilo Corp.',
      age: 29,
    });

    expect(result.isFailure).toBe(false);

    const getRes = await repo.getById(IdVO.create(VALID_CLIENT_UUID));
    const updated = getRes.getValue()!;
    expect(updated.company).toBe('New Saikilo Corp.');
    expect(updated.age).toBe(29);
    expect(updated.firstName).toBe('Kember'); // Kept original
  });

  it('should fail to update a client if value object rules are broken (UpdateClient)', async () => {
    const repo = makeMockClientRepository();
    const updateClient = makeUpdateClient(repo);

    const result = await updateClient({
      id: VALID_CLIENT_UUID,
      age: -1 // Broken PositiveNumberVO contract
    });

    expect(result.isFailure).toBe(true);
  });

  it('should successfully delete an existing client (DeleteClient)', async () => {
    const repo = makeMockClientRepository();
    const deleteClient = makeDeleteClient(repo);

    const result = await deleteClient(VALID_CLIENT_UUID);
    expect(result.isFailure).toBe(false);

    const getAllRes = await repo.getAll({ limit: 1 as any });
    const count = getAllRes.getValue().total;
    expect(count).toBe(0);
  });
});
