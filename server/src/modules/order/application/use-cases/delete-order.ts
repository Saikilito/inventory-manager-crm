import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IOrder } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IOrderRepository } from '../repositories/order.repository.js';
import { RecalculateClientRating } from '../../../client/application/use-cases/recalculate-client-rating.js';

export type DeleteOrder = UseCase<string, void, DomainError>;

export const makeDeleteOrder = (
  orderRepository: IOrderRepository,
  recalculateClientRating: RecalculateClientRating,
): DeleteOrder => {
  return async (id: string) => {
    const composerResult = await ResultComposer.start()
      .useResult('existing', () => orderRepository.getById(IdVO.create(id)))
      .useResult('validateExisting', ({ existing }) => {
        const ord = existing as IOrder | null;
        if (!ord) {
          return Result.fail(new NotFoundError('Order not found'));
        }
        return Result.ok(ord);
      })
      .useResult('delete', () => orderRepository.deleteByIds([IdVO.create(id)], IdVO.generateNil()))
      .useResult('recalcRating', async ({ validateExisting }) => {
        const order = validateExisting as IOrder;
        const reResult = await recalculateClientRating(order.clientId);
        if (reResult.isFailure) {
          return Result.fail(reResult.getError());
        }
        return Result.ok();
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
