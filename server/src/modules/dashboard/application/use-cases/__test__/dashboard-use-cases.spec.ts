import { describe, it, expect } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { IDashboardRepository, ITopClient, ITopSeller } from '../../repositories/dashboard.repository.js';
import { makeGetTopClients } from '../get-top-clients.js';
import { makeGetTopSellers } from '../get-top-sellers.js';

const VALID_CLIENT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_SELLER_UUID = '550e8400-e29b-41d4-a716-446655440001';

const mockTopClient: ITopClient = {
  _id: VALID_CLIENT_UUID,
  total: 500,
  client: [{
    firstName: 'Lionel',
    lastName: 'Messi',
    address: 'Miami Florida',
    whatsapp: '+999999999',
    type: 'PREMIUM'
  }]
};

const mockTopSeller: ITopSeller = {
  _id: VALID_SELLER_UUID,
  total: 1500,
  seller: [{
    name: 'Seller Saikilo',
    email: 'seller@example.com',
    role: 'SELLER'
  }]
};

const makeMockDashboardRepository = (): IDashboardRepository => {
  return {
    async getTopClients(): Promise<Result<ITopClient[], Error>> {
      return Result.ok<ITopClient[], Error>([mockTopClient]);
    },
    async getTopSellers(): Promise<Result<ITopSeller[], Error>> {
      return Result.ok<ITopSeller[], Error>([mockTopSeller]);
    }
  };
};

describe('Dashboard Use Cases (TDD)', () => {
  it('should retrieve top clients successfully (GetTopClients)', async () => {
    const repo = makeMockDashboardRepository();
    const getTopClients = makeGetTopClients(repo);

    const result = await getTopClients();
    expect(result.isFailure).toBe(false);
    expect(result.getValue().length).toBe(1);
    expect(result.getValue()[0].total).toBe(500);
    expect(result.getValue()[0].client[0].firstName).toBe('Lionel');
  });

  it('should retrieve top sellers successfully (GetTopSellers)', async () => {
    const repo = makeMockDashboardRepository();
    const getTopSellers = makeGetTopSellers(repo);

    const result = await getTopSellers();
    expect(result.isFailure).toBe(false);
    expect(result.getValue().length).toBe(1);
    expect(result.getValue()[0].total).toBe(1500);
    expect(result.getValue()[0].seller[0].name).toBe('Seller Saikilo');
  });
});
