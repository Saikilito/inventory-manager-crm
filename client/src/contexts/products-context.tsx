import { createContext } from '@contexts/ploc-context';
import { ProductsPloc } from '@modules/product/presentation/ploc/products-ploc';

export const [ProductsPlocProvider, useProductsPloc] = createContext<ProductsPloc>();
