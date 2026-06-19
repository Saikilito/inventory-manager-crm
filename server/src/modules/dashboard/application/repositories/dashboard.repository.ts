import { Result } from '../../../../../../shared-domain/src/shared/result.js';

export interface ITopClient {
  _id: string;
  total: number;
  client: Array<{
    firstName: string;
    lastName: string;
    company: string;
    emails: string[];
    type: string;
  }>;
}

export interface ITopSeller {
  _id: string;
  total: number;
  seller: Array<{
    name: string;
    email: string;
    role: string;
  }>;
}

export interface IDashboardRepository {
  getTopClients(): Promise<Result<ITopClient[], Error>>;
  getTopSellers(): Promise<Result<ITopSeller[], Error>>;
}
