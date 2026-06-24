import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { ProductRepository, GetAllProductsResult } from '@modules/product/domain/product.repository';
import { makeProduct } from '@shared-domain/product/product.entity';
import { doTryResult } from '@shared-domain/shared/do-try-result';
import { DatabaseError } from '@shared-domain/shared/errors';
import { PRODUCTS_QUERY, SINGLE_PRODUCT_QUERY } from '../graphql/queries';
import { CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT } from '../graphql/mutations';

interface GQLProduct {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

interface GetAllProductsData {
  getAllProducts: GQLProduct[];
  totalProducts: number;
}

interface GetProductData {
  getProduct: GQLProduct;
}

export function makeApolloProductRepository(
  apolloClient: ApolloClient<NormalizedCacheObject>
): ProductRepository {
  return {
    getAll: async (limit, offset) => {
      return doTryResult(
        async (): Promise<GetAllProductsResult> => {
          const { data } = await apolloClient.query<GetAllProductsData>({
            query: PRODUCTS_QUERY,
            variables: {
              limit: limit,
              offset: offset,
            },
            fetchPolicy: 'no-cache',
          });

          return {
            products: data.getAllProducts.map((gqlProd) =>
              makeProduct({
                id: gqlProd._id,
                name: gqlProd.name,
                price: gqlProd.price,
                stock: gqlProd.stock,
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
        async (): Promise<any> => {
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
            price: gqlProd.price,
            stock: gqlProd.stock,
          });
        },
        (err) => new DatabaseError(err.message)
      );
    },

    create: async (product) => {
      return doTryResult(
        async (): Promise<string> => {
          const { data } = await apolloClient.mutate<{ setProduct: string }>({
            mutation: CREATE_PRODUCT,
            variables: {
              input: {
                name: product.name,
                price: Number(product.price),
                stock: Number(product.stock),
              },
            },
          });

          return data?.setProduct || 'Product created successfully';
        },
        (err) => new DatabaseError(err.message)
      );
    },

    update: async (product) => {
      return doTryResult(
        async (): Promise<string> => {
          const { data } = await apolloClient.mutate<{ updateProduct: string }>({
            mutation: UPDATE_PRODUCT,
            variables: {
              input: {
                _id: product.id,
                name: product.name,
                price: Number(product.price),
                stock: Number(product.stock),
              },
            },
          });

          return data?.updateProduct || 'Product updated successfully';
        },
        (err) => new DatabaseError(err.message)
      );
    },

    delete: async (id) => {
      return doTryResult(
        async (): Promise<string> => {
          const { data } = await apolloClient.mutate<{ deleteProduct: string }>({
            mutation: DELETE_PRODUCT,
            variables: { _id: id },
          });

          return data?.deleteProduct || 'Product deleted successfully';
        },
        (err) => new DatabaseError(err.message)
      );
    },
  };
}
