import { DashboardRepository, ITopClient } from '../../domain/dashboard.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface GetTopClientsUseCase {
  execute(): Promise<Result<ITopClient[], DomainError>>;
}

export function makeGetTopClientsUseCase(repository: DashboardRepository): GetTopClientsUseCase {
  return {
    execute: () => repository.getTopClients(),
  };
}
