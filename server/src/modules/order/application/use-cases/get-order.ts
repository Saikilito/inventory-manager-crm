import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createNotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IOrder } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IOrderRepository } from '../repositories/order.repository.js';

export type GetOrder = UseCase<string, IOrder, DomainError>;

export const makeGetOrder = (orderRepository: IOrderRepository): GetOrder => {
  return async (id: string) => {
    const composerResult = await ResultComposer.start()
      .useResult('order', () => orderRepository.getById(IdVO.create(id)))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const order = composerResult.getValue().order;
    if (!order) {
      return Result.fail(createNotFoundError('Order not found'));
    }

    return Result.ok(order);
  };
};
