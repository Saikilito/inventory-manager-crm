import { makeGetByIdUseCase } from '../../../../../../shared-domain/src/shared/make-get-by-id.js';
import { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IProductRepository } from '../repositories/product.repository.js';

export type GetProduct = ReturnType<typeof makeGetProduct>;

export const makeGetProduct = (productRepository: IProductRepository) =>
  makeGetByIdUseCase<IProduct>('Product', (id) => productRepository.getById(id));
