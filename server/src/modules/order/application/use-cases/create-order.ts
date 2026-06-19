import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IOrder, makeOrder } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IOrderRepository } from '../repositories/order.repository.js';

export interface CreateOrderInput {
  items: Array<{ productId: string; quantity: number }>;
  total: number;
  clientId: string;
  sellerId: string;
}

export type CreateOrder = UseCase<CreateOrderInput, IOrder, DomainError>;

export const makeCreateOrder = (orderRepository: IOrderRepository): CreateOrder => {
  return async (input: CreateOrderInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('order', () => {
        return Result.ok(makeOrder({
          items: input.items,
          total: input.total,
          clientId: input.clientId,
          status: 'PENDING',
          sellerId: input.sellerId,
        }));
      })
      .useResult('savedOrder', ({ order }) => orderRepository.create(order, IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok(composerResult.getValue().savedOrder);
  };
};
