import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IOrder, makeOrder, OrderStatus } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IOrderRepository } from '../repositories/order.repository.js';
import { RecalculateClientRating } from '../../../client/application/use-cases/recalculate-client-rating.js';
import { IProductRepository } from '../../../product/application/repositories/product.repository.js';

export interface CreateOrderInput {
  items: Array<{ productId: string; quantity: number }>;
  total: number;
  clientId: string;
  sellerId: string;
  contextId?: string;
}

export type CreateOrder = UseCase<CreateOrderInput, IOrder, DomainError>;

export const makeCreateOrder = (
  orderRepository: IOrderRepository,
  productRepository: IProductRepository,
  recalculateClientRating: RecalculateClientRating,
): CreateOrder => {
  return async (input: CreateOrderInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('products', async () => {
        const productMap = new Map();
        for (const item of input.items) {
          const productResult = await productRepository.getById(IdVO.create(item.productId));
          if (productResult.isFailure) return Result.fail(productResult.getError());
          const product = productResult.getValue();
          if (!product) return Result.fail(new NotFoundError(`Product not found: ${item.productId}`));
          productMap.set(item.productId, product);
        }
        return Result.ok(productMap);
      })
      .useResult('order', ({ products }) => {
        const enrichedItems = input.items.map(item => {
          const prod = products.get(item.productId);
          return {
            ...item,
            purchasePriceAtSale: prod?.purchasePrice || 0,
            sellingPriceAtSale: prod?.sellingPrice || 0
          };
        });
        
        return Result.ok(makeOrder({
          items: enrichedItems,
          total: input.total,
          clientId: input.clientId,
          status: OrderStatus.PENDING,
          sellerId: input.sellerId,
          contextId: input.contextId,
        }));
      })
      .useResult('savedOrder', ({ order }) => orderRepository.create(order, IdVO.generateNil()))
      .useResult('recalcRating', async () => {
        const reResult = await recalculateClientRating(input.clientId);
        if (reResult.isFailure) {
          return Result.fail(reResult.getError());
        }
        return Result.ok();
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok(composerResult.getValue().savedOrder);
  };
};
