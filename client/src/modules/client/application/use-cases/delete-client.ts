import { ClientRepository } from '../../domain/client.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';

export interface DeleteClientUseCase {
  execute(id: Id): Promise<Result<boolean, DomainError>>;
}

export function makeDeleteClientUseCase(repository: ClientRepository): DeleteClientUseCase {
  return {
    execute: (id) => repository.delete(id),
  };
}
