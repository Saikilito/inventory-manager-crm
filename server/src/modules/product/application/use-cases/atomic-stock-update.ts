import mongoose from 'mongoose';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { createNotFoundError, createDatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IProduct, makeProduct, calculateWeightedAveragePrice } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IProductRepository } from '../repositories/product.repository.js';
import { ProductModel } from '../../infrastructure/product.model.js';

export interface StockLotItemInput {
  productId?: string | { toString(): string };
  productName: string | { toString(): string };
  quantity: number | { toString(): string };
  unitCost: number | { toString(): string };
  confirmedSellingPrice: number | { toString(): string };
}

export const atomicIncrementStock = async (
  productId: string,
  quantityToAdd: number,
  newUnitCost: number,
  productRepository: IProductRepository,
): Promise<Result<IProduct, DomainError>> => {
  try {
    const productResult = await productRepository.getById(IdVO.create(productId));
    if (productResult.isFailure || !productResult.getValue()) {
      return Result.fail(createNotFoundError('Product not found for stock update'));
    }

    const currentProduct = productResult.getValue()!;
    const currentStock = Number(currentProduct.stock);
    const currentPrice = Number(currentProduct.purchasePrice);

    const newPrice = calculateWeightedAveragePrice(currentPrice, currentStock, newUnitCost, quantityToAdd);

    await ProductModel.updateOne(
      { _id: new mongoose.Types.ObjectId(productId) },
      {
        $inc: { stock: quantityToAdd },
        $set: { purchasePrice: newPrice },
      },
    ).exec();

    const updatedResult = await productRepository.getById(IdVO.create(productId));
    if (updatedResult.isFailure || !updatedResult.getValue()) {
      return Result.fail(createDatabaseError('Failed to fetch updated product'));
    }

    return Result.ok(updatedResult.getValue()!);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update stock';
    return Result.fail(createDatabaseError(message));
  }
};

export interface ProductProcessingItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitCost: number;
  confirmedSellingPrice: number;
  isNewProduct: boolean;
  entity?: IProduct;
}

export const processStockLotItems = async (
  items: StockLotItemInput[],
  productRepository: IProductRepository,
  contextId?: string,
): Promise<Result<ProductProcessingItem[], DomainError>> => {
  const results: ProductProcessingItem[] = [];

  for (const item of items) {
    const rawProductId = item.productId ? item.productId.toString() : undefined;
    const rawProductName = item.productName.toString().trim();
    const quantity = Number(item.quantity);
    const unitCost = Number(item.unitCost);
    const confirmedSellingPrice = Number(item.confirmedSellingPrice);

    let existingProduct: IProduct | undefined;

    if (rawProductId) {
      const productResult = await productRepository.getById(IdVO.create(rawProductId));
      if (!productResult.isFailure && productResult.getValue()) {
        existingProduct = productResult.getValue()!;
      }
    }

    if (!existingProduct) {
      const allProductsResult = await productRepository.getAll({
        where: {
          fields: contextId
            ? [{ field: NonEmptyStringVO.create('contextId'), operator: '=' as const, value: contextId }]
            : [],
        },
      });

      if (allProductsResult.isFailure) {
        return Result.fail(allProductsResult.getError());
      }

      const allProducts = allProductsResult.getValue().items;
      const normalizedName = rawProductName.toLowerCase();
      existingProduct = allProducts.find(
        (p: IProduct) => p.name.toString().trim().toLowerCase() === normalizedName,
      );
    }

    if (existingProduct) {
      results.push({
        productId: existingProduct.id!.toString(),
        productName: rawProductName,
        quantity,
        unitCost,
        confirmedSellingPrice,
        isNewProduct: false,
        entity: existingProduct,
      });
    } else {
      const newProduct = makeProduct({
        name: rawProductName,
        purchasePrice: unitCost,
        sellingPrice: confirmedSellingPrice,
        stock: 0,
        contextId,
      });

      results.push({
        productId: new mongoose.Types.ObjectId().toHexString(),
        productName: rawProductName,
        quantity,
        unitCost,
        confirmedSellingPrice,
        isNewProduct: true,
        entity: newProduct,
      });
    }
  }

  return Result.ok(results);
};

export interface StockLotProductUpdatesOutput {
  createdProducts: IProduct[];
  updatedProducts: IProduct[];
}

export const applyStockLotProductUpdates = async (
  products: ProductProcessingItem[],
  userId: string,
  productRepository: IProductRepository,
): Promise<StockLotProductUpdatesOutput> => {
  const finalProducts: IProduct[] = [];

  for (const p of products) {
    if (p.isNewProduct && p.entity) {
      p.entity.id = IdVO.create(p.productId!);
      const createResult = await productRepository.create(p.entity, IdVO.create(userId));
      if (createResult.isFailure) {
        throw new Error(createResult.getError().message);
      }
      finalProducts.push(p.entity);
    }

    const updateResult = await atomicIncrementStock(p.productId!, p.quantity, p.unitCost, productRepository);

    if (updateResult.isFailure) {
      throw new Error(updateResult.getError().message);
    }

    if (!p.isNewProduct) {
      finalProducts.push(updateResult.getValue()!);
    }
  }

  const createdProducts = products
    .filter((p) => p.isNewProduct)
    .map((p) => finalProducts.find((fp) => fp.id?.toString() === p.productId)!);
  const updatedProducts = products
    .filter((p) => !p.isNewProduct)
    .map((p) => finalProducts.find((fp) => fp.id?.toString() === p.productId)!);

  return { createdProducts, updatedProducts };
};
