import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface ITopClient {
  total: number;
  clientName: string;
}

export interface ITopSeller {
  total: number;
  sellerName: string;
}

export interface DashboardRepository {
  getTopClients(): Promise<Result<ITopClient[], DomainError>>;
  getTopSellers(): Promise<Result<ITopSeller[], DomainError>>;
}
