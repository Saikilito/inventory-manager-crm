import { ContextRepository } from '../../domain/context.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { IContext } from '@shared-domain/context/context.entity.js';

export interface UpdateContextUseCase {
  execute(context: IContext): Promise<Result<IContext, DomainError>>;
}

export function makeUpdateContextUseCase(repository: ContextRepository): UpdateContextUseCase {
  return {
    execute: (context) => repository.update(context),
  };
}
