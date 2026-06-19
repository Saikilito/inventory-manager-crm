import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { IOrderRepository } from '../repositories/order.repository.js';

export type TotalOrders = UseCase<void, number, DomainError>;

export const makeTotalOrders = (orderRepository: IOrderRepository): TotalOrders => {
  return async () => {
    const composerResult = await ResultComposer.start()
      .useResult('ordersResult', () =>
        orderRepository.getAll({
          limit: PositiveNumberVO.create(1),
        })
      )
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok(composerResult.getValue().ordersResult.total);
  };
};
