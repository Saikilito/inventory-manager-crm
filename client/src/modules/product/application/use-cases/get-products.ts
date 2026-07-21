import { ProductRepository } from '../../domain/product.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { GetAllProductsResult } from '../../domain/product.repository.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { PositiveNumber } from '@shared-domain/shared/value-objects/positive-number.vo.js';
import { NonNegativeNumber } from '@shared-domain/shared/value-objects/non-negative-number.vo.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';

export interface GetProductsUseCase {
  execute(
    limit?: PositiveNumber,
    offset?: NonNegativeNumber,
    contextId?: Id
  ): Promise<Result<GetAllProductsResult, DomainError>>;
}

export function makeGetProductsUseCase(repository: ProductRepository): GetProductsUseCase {
  return {
    execute: (limit, offset, contextId) => repository.getAll(limit, offset, contextId),
  };
}
