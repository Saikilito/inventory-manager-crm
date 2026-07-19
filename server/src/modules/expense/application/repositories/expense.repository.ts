import { BaseRepository } from '../../../../../../shared-domain/src/shared/repository.js';
import { IExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { Id } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';

export interface IExpenseRepository extends BaseRepository<IExpense> {
  dissociateByContextId(contextId: Id): Promise<Result<void, DatabaseError>>;
}
