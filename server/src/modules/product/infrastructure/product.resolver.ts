import { IContext } from '../../../config/apollo.js';
import { IProduct } from '../../../../../shared-domain/src/product/product.entity.js';
import {
  calculateProfit,
  calculateProfitMargin,
  calculateStockValue,
  calculatePotentialProfit,
} from '../../../../../shared-domain/src/product/product-calculations.js';

interface SetProductInput {
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  contextId?: string;
}

interface UpdateProductInput {
  _id: string;
  name?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  stock?: number;
  contextId?: string;
}

const mapToGql = (product: IProduct) => {
  const purchasePrice = Number(product.purchasePrice) || 0;
  const sellingPrice = Number(product.sellingPrice) || 0;
  const stock = Number(product.stock) || 0;
  
  const profit = calculateProfit(sellingPrice, purchasePrice);
  const profitMargin = calculateProfitMargin(sellingPrice, purchasePrice);
  const stockValue = calculateStockValue(purchasePrice, stock);
  const potentialProfit = calculatePotentialProfit(sellingPrice, purchasePrice, stock);

  return {
    _id: product.id,
    name: product.name,
    purchasePrice,
    sellingPrice,
    profit,
    profitMargin,
    stock,
    stockValue,
    potentialProfit,
    contextId: product.contextId?.toString() || null,
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
      { limit, offset, contextId }: { limit?: number; offset?: number; contextId?: string },
      { container }: IContext,
    ) => {
      const result = await container.product.getAllProducts({ limit, offset, contextId });
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

    productStats: async (
      _parent: unknown,
      { contextId }: { contextId?: string },
      { container }: IContext,
    ) => {
      const result = await container.product.getAllProducts({ contextId });
      if (result.isFailure) {
        throw result.getError();
      }

      const products = result.getValue();
      let totalStock = 0;
      let totalStockValue = 0;
      let totalPotentialProfit = 0;
      let totalMargin = 0;
      let productCount = 0;

      for (const p of products) {
        const purchasePrice = Number(p.purchasePrice) || 0;
        const sellingPrice = Number(p.sellingPrice) || 0;
        const stock = Number(p.stock) || 0;
        const profit = calculateProfit(sellingPrice, purchasePrice);

        totalStock += stock;
        totalStockValue += calculateStockValue(purchasePrice, stock);
        totalPotentialProfit += calculatePotentialProfit(sellingPrice, purchasePrice, stock);

        if (sellingPrice > 0) {
          totalMargin += calculateProfitMargin(sellingPrice, purchasePrice);
          productCount++;
        }
      }

      return {
        totalProducts: products.length,
        totalStock: Number(totalStock.toFixed(4)),
        totalStockValue: Number(totalStockValue.toFixed(2)),
        totalPotentialProfit: Number(totalPotentialProfit.toFixed(2)),
        averageMargin: productCount > 0 ? Number((totalMargin / productCount).toFixed(2)) : 0,
      };
    },
  },

  Mutation: {
    setProduct: async (_parent: unknown, { input }: { input: SetProductInput }, { container }: IContext) => {
      const result = await container.product.createProduct({
        name: input.name,
        purchasePrice: input.purchasePrice,
        sellingPrice: input.sellingPrice,
        stock: input.stock,
        contextId: input.contextId,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    updateProduct: async (_parent: unknown, { input }: { input: UpdateProductInput }, { container }: IContext) => {
      const result = await container.product.updateProduct({
        id: input._id,
        name: input.name,
        purchasePrice: input.purchasePrice,
        sellingPrice: input.sellingPrice,
        stock: input.stock,
        contextId: input.contextId,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    deleteProduct: async (_parent: unknown, { _id }: { _id: string }, { container }: IContext) => {
      const result = await container.product.deleteProduct(_id);
      return !result.isFailure;
    },
  },
};
