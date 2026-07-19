import { BaseRepository } from '../../../../../../shared-domain/src/shared/repository.js';
import { IFixedExpense, IFixedExpensePayment } from '../../../../../../shared-domain/src/expense/fixed-expense.entity.js';
import { Id } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';

export interface IFixedExpenseRepository extends BaseRepository<IFixedExpense> {
  dissociateByContextId(contextId: Id): Promise<Result<void, DatabaseError>>;
}

export interface IFixedExpensePaymentRepository extends BaseRepository<IFixedExpensePayment> {
  getByMonthAndExpense(fixedExpenseId: Id, billingMonth: string): Promise<Result<IFixedExpensePayment | null, DatabaseError>>;
}
