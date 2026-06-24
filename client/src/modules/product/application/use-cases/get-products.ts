import { ProductRepository } from '../../domain/product.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { GetAllProductsResult } from '../../domain/product.repository.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { PositiveNumber } from '@shared-domain/shared/value-objects/positive-number.vo.js';

export interface GetProductsUseCase {
  execute(limit?: PositiveNumber, offset?: PositiveNumber): Promise<Result<GetAllProductsResult, DomainError>>;
}

export function makeGetProductsUseCase(repository: ProductRepository): GetProductsUseCase {
  return {
    execute: (limit, offset) => repository.getAll(limit, offset),
  };
}
