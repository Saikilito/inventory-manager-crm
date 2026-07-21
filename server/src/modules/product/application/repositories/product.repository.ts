import { BaseRepository, IShared } from '../../../../../../shared-domain/src/shared/repository.js';
import { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';

export interface ProductSearchTokens {
  nameTokens: ReadonlyArray<string>;
  contextId?: string;
  motoBrand?: string;
  motoModel?: string;
  partBrand?: string;
  limit: number;
}

/**
 * IProductRepository
 *
 * Extends the standard BaseRepository with a search-by-tokens method used by
 * the chat AI tool dispatcher. Centralising the search logic here (instead of
 * inside the dispatcher's infrastructure layer) keeps the dispatcher free of
 * direct Mongoose access and ensures all product searches pass through
 * repository-level sanitisation.
 */
export interface IProductRepository extends BaseRepository<IProduct> {
  searchByTokens(
    tokens: ProductSearchTokens,
  ): Promise<IShared.PaginatedResult<IProduct>>;
}
