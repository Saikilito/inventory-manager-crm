import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { WhereField } from '../../../../../../shared-domain/src/shared/repository.js';
import { IOrder } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IOrderRepository } from '../repositories/order.repository.js';

export type GetOrderClient = UseCase<string, IOrder[], DomainError>;

export const makeGetOrderClient = (orderRepository: IOrderRepository): GetOrderClient => {
  return async (clientId: string) => {
    const composerResult = await ResultComposer.start()
      .useResult('ordersResult', () => {
        const fields: WhereField[] = [{
          field: NonEmptyStringVO.create('clientId'),
          value: clientId,
          operator: '=',
        }];

        return orderRepository.getAll({
          limit: PositiveNumberVO.create(1000),
          where: { fields },
        });
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok(composerResult.getValue().ordersResult.items);
  };
};
