import { ContextRepository } from '../../domain/context.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { IContext } from '@shared-domain/context/context.entity.js';

export interface CreateContextUseCase {
  execute(context: IContext): Promise<Result<IContext, DomainError>>;
}

export function makeCreateContextUseCase(repository: ContextRepository): CreateContextUseCase {
  return {
    execute: (context) => repository.create(context),
  };
}
