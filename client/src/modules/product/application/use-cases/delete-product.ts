import { ProductRepository } from '../../domain/product.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';

export interface DeleteProductUseCase {
  execute(id: Id): Promise<Result<string, DomainError>>;
}

export function makeDeleteProductUseCase(repository: ProductRepository): DeleteProductUseCase {
  return {
    execute: (id) => repository.delete(id),
  };
}
