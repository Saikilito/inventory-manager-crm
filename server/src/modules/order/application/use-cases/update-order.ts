import { match } from 'ts-pattern';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IOrder, makeOrder, OrderStatus } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IOrderRepository } from '../repositories/order.repository.js';
import { IProductRepository } from '../../../product/application/repositories/product.repository.js';
import { IProduct, makeProduct } from '../../../../../../shared-domain/src/product/product.entity.js';

export interface UpdateOrderInput {
  id: string;
  items?: Array<{ productId: string; quantity: number }>;
  total?: number;
  clientId?: string;
  status?: OrderStatus;
  sellerId?: string;
}

export type UpdateOrder = UseCase<UpdateOrderInput, void, DomainError>;

export const makeUpdateOrder = (
  orderRepository: IOrderRepository,
  productRepository: IProductRepository
): UpdateOrder => {
  return async (input: UpdateOrderInput) => {
    // 1. Fetch existing order and construct the updated order object using ResultComposer
    const composerResult = await ResultComposer.start()
      .useResult('existing', () => orderRepository.getById(IdVO.create(input.id)))
      .useResult('validateExisting', ({ existing }) => {
        const ord = existing as IOrder | null;
        if (!ord) {
          return Result.fail(new NotFoundError('Order not found'));
        }
        return Result.ok(ord);
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { validateExisting: existing } = composerResult.getValue() as { validateExisting: IOrder };

    const updated = makeOrder({
      id: input.id,
      items: input.items ? input.items : existing.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      total: input.total !== undefined ? input.total : existing.total,
      clientId: input.clientId !== undefined ? input.clientId : existing.clientId,
      status: input.status !== undefined ? input.status : existing.status,
      sellerId: input.sellerId !== undefined ? input.sellerId : existing.sellerId,
    });

    // 2. Safely evaluate stock transition (PENDING -> COMPLETED deducts, COMPLETED -> CANCELLED restocks)
    const operation = match([existing.status, updated.status])
      .with([OrderStatus.PENDING, OrderStatus.COMPLETED], () => '-')
      .with([OrderStatus.COMPLETED, OrderStatus.CANCELLED], () => '+')
      .otherwise(() => '');

    // 3. Sequentially update product stocks if needed
    if (operation !== '') {
      for (const item of updated.items) {
        const prodResult = await productRepository.getById(IdVO.create(item.productId));
        if (prodResult.isFailure) {
          return Result.fail(prodResult.getError());
        }

        const product = prodResult.getValue();
        if (!product) {
          return Result.fail(new NotFoundError(`Product not found: ${item.productId}`));
        }

        const quantity = item.quantity;
        const newStock = operation === '-' 
          ? product.stock - quantity 
          : product.stock + quantity;

        if (newStock < 0) {
          return Result.fail(new Error(`Insuficient stock for product: ${product.name}`));
        }

        const updatedProduct = makeProduct({
          id: product.id,
          name: product.name,
          price: product.price,
          stock: newStock
        });

        const saveProdResult = await productRepository.updateById(IdVO.create(product.id!), updatedProduct, IdVO.generateNil());
        if (saveProdResult.isFailure) {
          return Result.fail(saveProdResult.getError());
        }
      }
    }

    // 4. Persist the updated order document
    const saveOrderResult = await orderRepository.updateById(IdVO.create(input.id), updated, IdVO.generateNil());
    if (saveOrderResult.isFailure) {
      return Result.fail(saveOrderResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
