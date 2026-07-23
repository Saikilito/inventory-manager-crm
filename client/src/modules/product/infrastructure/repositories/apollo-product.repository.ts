import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { ProductRepository, GetAllProductsResult } from '@modules/product/domain/product.repository';
import { makeProduct, IProduct } from '@shared-domain/product/product.entity';
import { doTryResult } from '@shared-domain/shared/do-try-result';
import { DatabaseError } from '@shared-domain/shared/errors';
import { PRODUCTS_QUERY, SINGLE_PRODUCT_QUERY } from '../graphql/queries';
import { CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT } from '../graphql/mutations';
import { GQLProduct } from '../graphql/types';
import { PRODUCT_MESSAGES } from '@modules/product/domain/product.constants';

interface GetAllProductsData {
  getAllProducts: GQLProduct[];
  totalProducts: number;
}

interface GetProductData {
  getProduct: GQLProduct;
}

interface SetProductData {
  setProduct: GQLProduct;
}

interface UpdateProductData {
  updateProduct: GQLProduct;
}

export function makeApolloProductRepository(
  apolloClient: ApolloClient<NormalizedCacheObject>
): ProductRepository {
  return {
    getAll: async (limit, offset, contextId) => {
      return doTryResult(
        async (): Promise<GetAllProductsResult> => {
          const { data } = await apolloClient.query<GetAllProductsData>({
            query: PRODUCTS_QUERY,
            variables: {
              limit: limit,
              offset: offset,
              contextId: contextId,
            },
            fetchPolicy: 'no-cache',
          });

          return {
            products: data.getAllProducts.map((gqlProd) =>
              makeProduct({
                id: gqlProd._id,
                name: gqlProd.name,
                purchasePrice: gqlProd.purchasePrice,
                sellingPrice: gqlProd.sellingPrice,
                stock: gqlProd.stock,
                contextId: gqlProd.contextId,
              })
            ),
            totalProducts: data.totalProducts,
          };
        },
        (err) => new DatabaseError(err.message)
      );
    },

    getById: async (id) => {
      return doTryResult(
        async (): Promise<IProduct | null> => {
          const { data } = await apolloClient.query<GetProductData>({
            query: SINGLE_PRODUCT_QUERY,
            variables: { id: id },
            fetchPolicy: 'no-cache',
          });

          if (!data || !data.getProduct) {
            return null;
          }

          const gqlProd = data.getProduct;
          return makeProduct({
            id: gqlProd._id,
            name: gqlProd.name,
            purchasePrice: gqlProd.purchasePrice,
            sellingPrice: gqlProd.sellingPrice,
            stock: gqlProd.stock,
            contextId: gqlProd.contextId,
          });
        },
        (err) => new DatabaseError(err.message)
      );
    },

    create: async (product) => {
      return doTryResult(
        async (): Promise<string> => {
          const { data } = await apolloClient.mutate<SetProductData>({
            mutation: CREATE_PRODUCT,
            variables: {
              input: {
                name: product.name,
                purchasePrice: Number(product.purchasePrice),
                sellingPrice: Number(product.sellingPrice),
                stock: Number(product.stock),
                contextId: product.contextId,
              },
            },
          });

          return data?.setProduct?._id || PRODUCT_MESSAGES.CREATED;
        },
        (err) => new DatabaseError(err.message)
      );
    },

    update: async (product) => {
      return doTryResult(
        async (): Promise<string> => {
          const { data } = await apolloClient.mutate<UpdateProductData>({
            mutation: UPDATE_PRODUCT,
            variables: {
              input: {
                _id: product.id,
                name: product.name,
                purchasePrice: Number(product.purchasePrice),
                sellingPrice: Number(product.sellingPrice),
                stock: Number(product.stock),
                contextId: product.contextId,
              },
            },
          });

          return data?.updateProduct?._id || PRODUCT_MESSAGES.UPDATED;
        },
        (err) => new DatabaseError(err.message)
      );
    },

    delete: async (id) => {
      return doTryResult(
        async (): Promise<string> => {
          const { data } = await apolloClient.mutate<{ deleteProduct: boolean }>({
            mutation: DELETE_PRODUCT,
            variables: { _id: id },
          });

          return data?.deleteProduct ? PRODUCT_MESSAGES.DELETED : PRODUCT_MESSAGES.DELETE_FAILED;
        },
        (err) => new DatabaseError(err.message)
      );
    },
  };
}
