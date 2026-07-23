import { makePloc, Ploc } from '@modules/shared/presentation/ploc/ploc';
import { productsInitialState, ProductsState, ProductsStateKind } from './products-state';
import { GetProductsUseCase } from '@modules/product/application/use-cases/get-products';
import { DeleteProductUseCase } from '@modules/product/application/use-cases/delete-product';
import { PositiveNumberVO } from '@shared-domain/shared/value-objects/positive-number.vo';
import { NonNegativeNumberVO } from '@shared-domain/shared/value-objects/non-negative-number.vo';
import { IdVO } from '@shared-domain/shared/value-objects/id.vo';
import { PRODUCT_MESSAGES } from '@modules/product/domain/product.constants';

export interface ProductsPloc extends Ploc<ProductsState> {
  load(page?: number, limit?: number): Promise<void>;
  search(term: string): Promise<void>;
  deleteProduct(id: string): Promise<void>;
}

export function makeProductsPloc(
  getProducts: GetProductsUseCase,
  deleteProductUseCase: DeleteProductUseCase
): ProductsPloc {
  const ploc = makePloc<ProductsState>(productsInitialState);

  const load = async (page: number = 1, limit: number = 10) => {
    const currentState = ploc.state();
    
    if (currentState.kind === ProductsStateKind.LOADED) {
      ploc.changeState({
        kind: ProductsStateKind.RELOADING,
        products: currentState.products,
        searchTerm: currentState.searchTerm,
        currentPage: page,
        limit,
        totalProducts: currentState.totalProducts,
      });
    } else {
      ploc.changeState({
        kind: ProductsStateKind.LOADING,
        searchTerm: currentState.searchTerm,
        currentPage: page,
        limit,
        totalProducts: currentState.totalProducts,
      });
    }

    const offsetVal = (page - 1) * limit;
    const limitVO = PositiveNumberVO.create(limit);
    const offsetVO = NonNegativeNumberVO.create(offsetVal);

    const result = await getProducts.execute(limitVO, offsetVO);

    if (result.isFailure) {
      const err = result.getError();
      ploc.changeState({
        kind: ProductsStateKind.ERROR,
        errorMessage: err.message || PRODUCT_MESSAGES.ERROR_LOADING,
        searchTerm: currentState.searchTerm,
        currentPage: page,
        limit,
        totalProducts: 0,
      });
    } else {
      const data = result.getValue();
      ploc.changeState({
        kind: ProductsStateKind.LOADED,
        products: data.products,
        totalProducts: data.totalProducts,
        searchTerm: currentState.searchTerm,
        currentPage: page,
        limit,
      });
    }
  };

  const search = async (term: string) => {
    const currentState = ploc.state();
    ploc.changeState({
      ...currentState,
      searchTerm: term,
    });
    await load(1, currentState.limit);
  };

  const deleteProduct = async (id: string) => {
    const currentState = ploc.state();
    const idVO = IdVO.create(id);

    const result = await deleteProductUseCase.execute(idVO);

    if (result.isFailure) {
      const err = result.getError();
      ploc.changeState({
        ...currentState,
        kind: ProductsStateKind.ERROR,
        errorMessage: err.message || PRODUCT_MESSAGES.ERROR_DELETING,
      });
    } else {
      load(currentState.currentPage, currentState.limit);
    }
  };

  return {
    ...ploc,
    load,
    search,
    deleteProduct,
  };
}
