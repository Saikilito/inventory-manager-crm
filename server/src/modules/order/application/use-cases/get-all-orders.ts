import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { IOrder } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IOrderRepository } from '../repositories/order.repository.js';

export interface GetAllOrdersInput {
  limit?: number;
  offset?: number;
}

export type GetAllOrders = UseCase<GetAllOrdersInput, IOrder[], DomainError>;

export const makeGetAllOrders = (orderRepository: IOrderRepository): GetAllOrders => {
  return async (input: GetAllOrdersInput) => {
    const limitNum = input.limit ?? 10;
    const offsetNum = input.offset ?? 0;
    const pageNum = Math.floor(offsetNum / limitNum) + 1;

    const composerResult = await ResultComposer.start()
      .useResult('ordersResult', () =>
        orderRepository.getAll({
          limit: PositiveNumberVO.create(limitNum),
          page: PositiveNumberVO.create(pageNum),
        })
      )
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok(composerResult.getValue().ordersResult.items);
  };
};
