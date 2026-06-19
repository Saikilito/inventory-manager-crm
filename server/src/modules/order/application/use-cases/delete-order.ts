import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IOrderRepository } from '../repositories/order.repository.js';

export type DeleteOrder = UseCase<string, void, DomainError>;

export const makeDeleteOrder = (orderRepository: IOrderRepository): DeleteOrder => {
  return async (id: string) => {
    const composerResult = await ResultComposer.start()
      .useResult('delete', () => orderRepository.deleteByIds([IdVO.create(id)], IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
