import { ContextRepository } from '../../domain/context.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { IContext } from '@shared-domain/context/context.entity.js';

export interface GetAllContextsUseCase {
  execute(): Promise<Result<IContext[], DomainError>>;
}

export function makeGetAllContextsUseCase(repository: ContextRepository): GetAllContextsUseCase {
  return {
    execute: () => repository.getAll(),
  };
}
