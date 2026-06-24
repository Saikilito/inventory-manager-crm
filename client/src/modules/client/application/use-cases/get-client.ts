import { ClientRepository } from '../../domain/client.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IClient } from '@shared-domain/client/client.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';

export interface GetClientUseCase {
  execute(id: Id): Promise<Result<IClient | null, DomainError>>;
}

export function makeGetClientUseCase(repository: ClientRepository): GetClientUseCase {
  return {
    execute: (id) => repository.getById(id),
  };
}
