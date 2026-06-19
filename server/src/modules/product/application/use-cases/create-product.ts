import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { makeProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IProductRepository } from '../repositories/product.repository.js';

export interface CreateProductInput {
  name: string;
  price: number;
  stock: number;
}

export type CreateProduct = UseCase<CreateProductInput, void, DomainError>;

export const makeCreateProduct = (productRepository: IProductRepository): CreateProduct => {
  return async (input: CreateProductInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('product', () => Result.ok(makeProduct(input)))
      .useResult('save', ({ product }) => productRepository.create(product, IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
