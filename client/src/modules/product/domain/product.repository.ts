import { Result } from '@shared-domain/shared/result.js';
import { IProduct } from '@shared-domain/product/product.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';
import { PositiveNumber } from '@shared-domain/shared/value-objects/positive-number.vo.js';

export interface GetAllProductsResult {
  products: IProduct[];
  totalProducts: number;
}

export interface ProductRepository {
  getAll(limit?: PositiveNumber, offset?: PositiveNumber): Promise<Result<GetAllProductsResult, DomainError>>;
  getById(id: Id): Promise<Result<IProduct | null, DomainError>>;
  create(product: IProduct): Promise<Result<string, DomainError>>;
  update(product: IProduct): Promise<Result<string, DomainError>>;
  delete(id: Id): Promise<Result<string, DomainError>>;
}
