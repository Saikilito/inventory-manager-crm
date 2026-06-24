import { ProductRepository } from '../../domain/product.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IProduct } from '@shared-domain/product/product.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface CreateProductUseCase {
  execute(product: IProduct): Promise<Result<string, DomainError>>;
}

export function makeCreateProductUseCase(repository: ProductRepository): CreateProductUseCase {
  return {
    execute: (product) => repository.create(product),
  };
}
