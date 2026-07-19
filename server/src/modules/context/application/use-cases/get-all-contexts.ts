import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { IContext } from '../../../../../../shared-domain/src/context/context.entity.js';
import { IContextRepository } from '../repositories/context.repository.js';

export interface GetAllContextsInput {
  limit?: number;
  offset?: number;
}

export type GetAllContexts = UseCase<GetAllContextsInput, IContext[], DomainError>;

export const makeGetAllContexts = (contextRepository: IContextRepository): GetAllContexts => {
  return async (input: GetAllContextsInput = {}) => {
    const limitNum = input.limit ?? 100;
    const offsetNum = input.offset ?? 0;
    const pageNum = Math.floor(offsetNum / limitNum) + 1;

    const limitResult = PositiveNumberVO.createResult(limitNum);
    if (limitResult.isFailure) {
      return Result.fail(limitResult.getError());
    }

    const pageResult = PositiveNumberVO.createResult(pageNum);
    if (pageResult.isFailure) {
      return Result.fail(pageResult.getError());
    }

    const contextsResult = await contextRepository.getAll({
      limit: limitResult.getValue(),
      page: pageResult.getValue(),
    });

    if (contextsResult.isFailure) {
      return Result.fail(contextsResult.getError());
    }

    return Result.ok(contextsResult.getValue().items);
  };
};
