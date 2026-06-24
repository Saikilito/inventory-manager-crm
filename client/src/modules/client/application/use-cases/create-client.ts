import { ClientRepository } from '../../domain/client.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IClient } from '@shared-domain/client/client.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface CreateClientUseCase {
  execute(client: IClient): Promise<Result<boolean, DomainError>>;
}

export function makeCreateClientUseCase(repository: ClientRepository): CreateClientUseCase {
  return {
    execute: (client) => repository.create(client),
  };
}
