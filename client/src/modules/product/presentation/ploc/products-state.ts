import { IProduct } from '@shared-domain/product/product.entity.js';

export const ProductsStateKind = {
  LOADING: 'products:loading',
  LOADED: 'products:loaded',
  RELOADING: 'products:reloading',
  ERROR: 'products:error',
} as const;

export type ProductsStateKind = typeof ProductsStateKind[keyof typeof ProductsStateKind];

export interface CommonProductsState {
  searchTerm: string;
  selectedContextId: string | null;
  currentPage: number;
  totalProducts: number;
  limit: number;
}

export interface LoadingProductsState {
  kind: typeof ProductsStateKind.LOADING;
}

export interface LoadedProductsState {
  kind: typeof ProductsStateKind.LOADED;
  products: IProduct[];
}

export interface ReloadingProductsState {
  kind: typeof ProductsStateKind.RELOADING;
  products: IProduct[];
}

export interface ErrorProductsState {
  kind: typeof ProductsStateKind.ERROR;
  errorMessage: string;
}

export type ProductsState = (
  | LoadingProductsState
  | LoadedProductsState
  | ReloadingProductsState
  | ErrorProductsState
) & CommonProductsState;

export const productsInitialState: ProductsState = {
  kind: ProductsStateKind.LOADING,
  searchTerm: '',
  selectedContextId: null,
  currentPage: 1,
  totalProducts: 0,
  limit: 10,
};
