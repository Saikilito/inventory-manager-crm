import { ClientRepository } from '../../domain/client.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IClient } from '@shared-domain/client/client.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface UpdateClientUseCase {
  execute(client: IClient): Promise<Result<boolean, DomainError>>;
}

export function makeUpdateClientUseCase(repository: ClientRepository): UpdateClientUseCase {
  return {
    execute: (client) => repository.update(client),
  };
}
