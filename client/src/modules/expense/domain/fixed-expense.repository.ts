import { Result } from '@shared-domain/shared/result.js';
import { IFixedExpense, IFixedExpensePayment } from '@shared-domain/expense/fixed-expense.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';

export interface FixedExpenseChecklistItem {
  fixedExpense: IFixedExpense;
  payment: IFixedExpensePayment | null;
}

export interface FixedExpenseRepository {
  getTemplates(contextId?: Id): Promise<Result<IFixedExpense[], DomainError>>;
  getChecklist(billingMonth: string, contextId?: Id): Promise<Result<FixedExpenseChecklistItem[], DomainError>>;
  createTemplate(fe: IFixedExpense): Promise<Result<IFixedExpense, DomainError>>;
  updateTemplate(fe: IFixedExpense): Promise<Result<IFixedExpense, DomainError>>;
  deleteTemplate(id: Id): Promise<Result<boolean, DomainError>>;
  payFixedExpense(fixedExpenseId: Id, billingMonth: string, amountPaid: number, contextId?: Id): Promise<Result<IFixedExpensePayment, DomainError>>;
  unpayFixedExpense(fixedExpenseId: Id, billingMonth: string): Promise<Result<boolean, DomainError>>;
}
