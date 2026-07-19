import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IContext, makeContext, ContextAttributeType } from '../../../../../../shared-domain/src/context/context.entity.js';
import { IContextRepository } from '../repositories/context.repository.js';
import { getErrorMessage } from '../../../../../../shared-domain/src/shared/error-utils.js';

export interface CreateContextInput {
  name: string;
  attributes: Array<{
    name: string;
    type: ContextAttributeType;
    required: boolean;
  }>;
}

export type CreateContext = UseCase<CreateContextInput, IContext, DomainError>;

export const makeCreateContext = (contextRepository: IContextRepository): CreateContext => {
  return async (input: CreateContextInput) => {
    let context: IContext;
    try {
      context = makeContext(input);
    } catch (error: unknown) {
      return Result.fail(
        error instanceof DomainError
          ? error
          : new DomainError(getErrorMessage(error))
      );
    }

    const savedContextResult = await contextRepository.create(context, IdVO.generateNil());
    if (savedContextResult.isFailure) {
      return Result.fail(savedContextResult.getError());
    }

    return Result.ok(savedContextResult.getValue());
  };
};
