import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IProductRepository } from '../repositories/product.repository.js';

export type GetProduct = UseCase<string, IProduct, DomainError>;

export const makeGetProduct = (productRepository: IProductRepository): GetProduct => {
  return async (id: string) => {
    const composerResult = await ResultComposer.start()
      .useResult('product', () => productRepository.getById(IdVO.create(id)))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const product = composerResult.getValue().product;
    if (!product) {
      return Result.fail(new NotFoundError('Product not found'));
    }

    return Result.ok(product);
  };
};
