import { IContext } from '../../../config/apollo.js';
import { IProduct } from '../../../../../shared-domain/src/product/product.entity.js';

interface SetProductInput {
  name: string;
  price: number;
  stock: number;
}

interface UpdateProductInput {
  _id: string;
  name?: string;
  price?: number;
  stock?: number;
}

const mapToGql = (product: IProduct) => {
  return {
    _id: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock,
  };
};

export default {
  Query: {
    getProduct: async (_parent: unknown, { _id }: { _id: string }, { container }: IContext) => {
      const result = await container.product.getProduct(_id);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    getAllProducts: async (
      _parent: unknown,
      { limit, offset }: { limit?: number; offset?: number },
      { container }: IContext,
    ) => {
      const result = await container.product.getAllProducts({ limit, offset });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().map(mapToGql);
    },

    totalProducts: async (_parent: unknown, _args: unknown, { container }: IContext) => {
      const result = await container.product.totalProducts();
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue();
    },
  },

  Mutation: {
    setProduct: async (_parent: unknown, { input }: { input: SetProductInput }, { container }: IContext) => {
      const result = await container.product.createProduct({
        name: input.name,
        price: input.price,
        stock: input.stock,
      });
      return !result.isFailure;
    },

    updateProduct: async (_parent: unknown, { input }: { input: UpdateProductInput }, { container }: IContext) => {
      const result = await container.product.updateProduct({
        id: input._id,
        name: input.name,
        price: input.price,
        stock: input.stock,
      });
      return !result.isFailure;
    },

    deleteProduct: async (_parent: unknown, { _id }: { _id: string }, { container }: IContext) => {
      const result = await container.product.deleteProduct(_id);
      return !result.isFailure;
    },
  },
};
