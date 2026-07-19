import { ContextRepository } from '../../domain/context.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';

export interface DeleteContextUseCase {
  execute(id: Id): Promise<Result<boolean, DomainError>>;
}

export function makeDeleteContextUseCase(repository: ContextRepository): DeleteContextUseCase {
  return {
    execute: (id) => repository.delete(id),
  };
}
