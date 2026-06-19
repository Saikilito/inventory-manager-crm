import { BaseRepository } from '../../../../../../shared-domain/src/shared/repository.js';
import { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';

export interface IProductRepository extends BaseRepository<IProduct> {}
