import { ClientRepository, GetAllClientsResult } from '../../domain/client.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';
import { PositiveNumber } from '@shared-domain/shared/value-objects/positive-number.vo.js';
import { NonNegativeNumber } from '@shared-domain/shared/value-objects/non-negative-number.vo.js';

export interface GetClientsUseCase {
  execute(limit?: PositiveNumber, offset?: NonNegativeNumber, sellerId?: Id): Promise<Result<GetAllClientsResult, DomainError>>;
}

export function makeGetClientsUseCase(repository: ClientRepository): GetClientsUseCase {
  return {
    execute: (limit, offset, sellerId) => repository.getAll(limit, offset, sellerId),
  };
}
