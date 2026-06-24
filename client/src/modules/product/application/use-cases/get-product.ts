import { ProductRepository } from '../../domain/product.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IProduct } from '@shared-domain/product/product.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';

export interface GetProductUseCase {
  execute(id: Id): Promise<Result<IProduct | null, DomainError>>;
}

export function makeGetProductUseCase(repository: ProductRepository): GetProductUseCase {
  return {
    execute: (id) => repository.getById(id),
  };
}
