import mongoose from 'mongoose';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { calculateWeightedAveragePrice } from '../../../../../../shared-domain/src/stock-lot/stock-lot.entity.js';
import { IProductRepository } from '../repositories/product.repository.js';
import { ProductModel } from '../../infrastructure/product.model.js';

/**
 * Atomically increments product stock and updates purchase price
 * Uses MongoDB $inc operator to prevent race conditions
 */
export const atomicIncrementStock = async (
  productId: string,
  quantityToAdd: number,
  newUnitCost: number,
  productRepository: IProductRepository,
): Promise<Result<IProduct, DomainError>> => {
  try {
    // Get current product state
    const productResult = await productRepository.getById(IdVO.create(productId));
    if (productResult.isFailure || !productResult.getValue()) {
      return Result.fail(new DomainError('Product not found for stock update'));
    }

    const currentProduct = productResult.getValue()!;
    const currentStock = Number(currentProduct.stock);
    const currentPrice = Number(currentProduct.purchasePrice);

    const newPrice = calculateWeightedAveragePrice(
      currentPrice,
      currentStock,
      newUnitCost,
      quantityToAdd,
    );

    // Use atomic $inc for stock to prevent race conditions
    await ProductModel.updateOne(
      { _id: new mongoose.Types.ObjectId(productId) },
      { 
        $inc: { stock: quantityToAdd },
        $set: { purchasePrice: newPrice },
      },
    ).exec();

    // Fetch updated product
    const updatedResult = await productRepository.getById(IdVO.create(productId));
    if (updatedResult.isFailure || !updatedResult.getValue()) {
      return Result.fail(new DomainError('Failed to fetch updated product'));
    }

    return Result.ok(updatedResult.getValue()!);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update stock';
    return Result.fail(new DomainError(message));
  }
};
