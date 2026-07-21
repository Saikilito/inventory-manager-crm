import { UseCase } from './use-case.js';
import { DomainError, NotFoundError } from './errors.js';
import { Result } from './result.js';
import { IdVO, Id } from './value-objects/id.vo.js';

/**
 * Generic factory for get-by-ID use cases.
 * Eliminates the repeated IdVO.create → repository.getById → null-check pattern.
 *
 * @param entityName - Human-readable name for error messages (e.g. "Product", "Client")
 * @param getById - Repository method that fetches entity by Id
 */
export const makeGetByIdUseCase = <T>(
  entityName: string,
  getById: (id: Id) => Promise<Result<T | null, DomainError>>,
): UseCase<string, T, DomainError> => {
  return async (id: string) => {
    const idResult = IdVO.createResult(id);
    if (idResult.isFailure) {
      return Result.fail(idResult.getError());
    }

    const entityResult = await getById(idResult.getValue());
    if (entityResult.isFailure) {
      return Result.fail(entityResult.getError());
    }

    const entity = entityResult.getValue();
    if (!entity) {
      return Result.fail(new NotFoundError(`${entityName} not found: ${id}`));
    }

    return Result.ok(entity);
  };
};
