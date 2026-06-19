import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IProduct, makeProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IProductRepository } from '../repositories/product.repository.js';

export interface UpdateProductInput {
  id: string;
  name?: string;
  price?: number;
  stock?: number;
}

export type UpdateProduct = UseCase<UpdateProductInput, void, DomainError>;

export const makeUpdateProduct = (productRepository: IProductRepository): UpdateProduct => {
  return async (input: UpdateProductInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('existing', () => productRepository.getById(IdVO.create(input.id)))
      .useResult('validateExisting', ({ existing }) => {
        const prod = existing as IProduct | null;
        if (!prod) {
          return Result.fail(new NotFoundError('Product not found'));
        }
        return Result.ok(prod);
      })
      .useResult('updated', ({ validateExisting }) => {
        const existingProd = validateExisting as IProduct;
        return Result.ok(makeProduct({
          id: input.id,
          name: input.name !== undefined ? input.name : (existingProd.name as unknown as string),
          price: input.price !== undefined ? input.price : (existingProd.price as unknown as number),
          stock: input.stock !== undefined ? input.stock : (existingProd.stock as unknown as number),
        }));
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { updated } = composerResult.getValue() as { updated: IProduct };

    const saveResult = await productRepository.updateById(IdVO.create(input.id), updated, IdVO.generateNil());
    if (saveResult.isFailure) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
