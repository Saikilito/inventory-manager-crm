import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, ContextInUseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IContextRepository } from '../repositories/context.repository.js';
import { IProductRepository } from '../../../product/application/repositories/product.repository.js';
import { IExpenseRepository } from '../../../expense/application/repositories/expense.repository.js';

export type DeleteContext = UseCase<string, void, DomainError>;

export const makeDeleteContext = (
  contextRepository: IContextRepository,
  productRepository: IProductRepository,
  expenseRepository: IExpenseRepository
): DeleteContext => {
  return async (id: string) => {
    const productCheck = await productRepository.getOne([
      { field: NonEmptyStringVO.create('contextId'), value: id, operator: '=' }
    ]);

    if (productCheck.isFailure) {
      return Result.fail(productCheck.getError());
    }

    if (productCheck.getValue() !== null) {
      return Result.fail(new ContextInUseError('Products are assigned to this context'));
    }

    const composerResult = await ResultComposer.start()
      .useResult('dissociateExpenses', () => expenseRepository.dissociateByContextId(IdVO.create(id)))
      .useResult('delete', () => contextRepository.deleteByIds([IdVO.create(id)], IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
