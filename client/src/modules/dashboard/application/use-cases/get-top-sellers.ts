import { DashboardRepository, ITopSeller } from '../../domain/dashboard.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface GetTopSellersUseCase {
  execute(): Promise<Result<ITopSeller[], DomainError>>;
}

export function makeGetTopSellersUseCase(repository: DashboardRepository): GetTopSellersUseCase {
  return {
    execute: () => repository.getTopSellers(),
  };
}
