import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IProductRepository } from '../repositories/product.repository.js';

export interface GetAllProductsInput {
  limit?: number;
  offset?: number;
  contextId?: string;
}

export type GetAllProducts = UseCase<GetAllProductsInput, IProduct[], DomainError>;

export const makeGetAllProducts = (productRepository: IProductRepository): GetAllProducts => {
  return async (input: GetAllProductsInput) => {
    const limitNum = input.limit ?? 10;
    const offsetNum = input.offset ?? 0;
    const pageNum = Math.floor(offsetNum / limitNum) + 1;

    const whereFields = input.contextId
      ? [{ field: NonEmptyStringVO.create('contextId'), value: input.contextId }]
      : [];

    const composerResult = await ResultComposer.start()
      .useResult('productsResult', () =>
        productRepository.getAll({
          limit: PositiveNumberVO.create(limitNum),
          page: PositiveNumberVO.create(pageNum),
          where: whereFields.length > 0 ? { fields: whereFields } : undefined,
        })
      )
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok(composerResult.getValue().productsResult.items);
  };
};
