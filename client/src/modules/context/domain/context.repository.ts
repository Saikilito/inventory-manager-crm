import { Result } from '@shared-domain/shared/result.js';
import { IContext } from '@shared-domain/context/context.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';

export interface ContextRepository {
  getAll(): Promise<Result<IContext[], DomainError>>;
  getById(id: Id): Promise<Result<IContext | null, DomainError>>;
  create(context: IContext): Promise<Result<IContext, DomainError>>;
  update(context: IContext): Promise<Result<IContext, DomainError>>;
  delete(id: Id): Promise<Result<boolean, DomainError>>;
}
