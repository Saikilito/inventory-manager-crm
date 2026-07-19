import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IContext } from '../../../../../../shared-domain/src/context/context.entity.js';
import { IContextRepository } from '../repositories/context.repository.js';

export type GetContext = UseCase<string, IContext, DomainError>;

export const makeGetContext = (contextRepository: IContextRepository): GetContext => {
  return async (id: string) => {
    const idResult = IdVO.createResult(id);
    if (idResult.isFailure) {
      return Result.fail(idResult.getError());
    }

    const contextResult = await contextRepository.getById(idResult.getValue());
    if (contextResult.isFailure) {
      return Result.fail(contextResult.getError());
    }

    const context = contextResult.getValue();
    if (!context) {
      return Result.fail(new NotFoundError('Context not found'));
    }

    return Result.ok(context);
  };
};
