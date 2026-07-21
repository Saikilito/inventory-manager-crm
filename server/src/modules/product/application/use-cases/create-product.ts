import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { makeProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IProductRepository } from '../repositories/product.repository.js';
import { LibrarianService } from '../../../knowledge/application/services/librarian.service.js';

export interface CreateProductInput {
  name: string;
  price: number;
  stock: number;
  category?: string;
  description?: string;
  sku?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  unitOfMeasure?: string;
}

export type CreateProduct = UseCase<CreateProductInput, void, DomainError>;

export const makeCreateProduct = (deps: {
  productRepository: IProductRepository;
  librarian?: LibrarianService;
}): CreateProduct => {
  const { productRepository, librarian } = deps;

  return async (input: CreateProductInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('product', () =>
        Result.ok(
          makeProduct({
            name: input.name,
            price: input.sellingPrice ?? input.price,
            purchasePrice: input.purchasePrice,
            sellingPrice: input.sellingPrice,
            stock: input.stock,
            unitOfMeasure: input.unitOfMeasure,
          }),
        ),
      )
      .useResult('save', ({ product }) => productRepository.create(product, IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    if (librarian && librarian.enabled()) {
      const saved = composerResult.getValue().save;
      const productEntity = Array.isArray(saved) ? saved[0] : saved;
      const productId = productEntity?.id?.toString();
      if (productId) {
        void librarian.extractFromProduct({
          productId: IdVO.create(productId),
          name: input.name,
          ...(input.category ? { category: input.category } : {}),
          ...(input.sellingPrice ?? input.price !== undefined ? { price: input.sellingPrice ?? input.price } : {}),
          ...(input.description ? { description: input.description } : {}),
          ...(input.sku ? { sku: input.sku } : {}),
        });
      }
    }

    return Result.ok<void, DomainError>();
  };
};
