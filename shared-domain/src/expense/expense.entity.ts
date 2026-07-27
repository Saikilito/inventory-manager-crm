import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { createValidationError } from '../shared/validation-error.js';
import { ExpenseCategory, ExpenseCategoryVO, type ExpenseCategoryType } from './value-objects/expense-category.vo.js';
import {
  ExpenseReferenceType,
  ExpenseReferenceTypeVO,
  type ExpenseReferenceTypeType,
} from './value-objects/expense-reference-type.vo.js';

export { ExpenseCategory, ExpenseCategoryVO, ExpenseReferenceType, ExpenseReferenceTypeVO };
export type { ExpenseCategoryType, ExpenseReferenceTypeType };

export interface IExpense {
  id?: Id;
  amount: PositiveNumber;
  description: NonEmptyString;
  category: ExpenseCategoryType;
  contextId?: Id;
  referenceId?: Id;
  referenceType?: ExpenseReferenceTypeType;
  accountId?: Id;
  accountName?: NonEmptyString;
  transactionId?: Id;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export const makeExpense = (props: {
  id?: string;
  amount: number;
  description: string;
  category: string;
  contextId?: string;
  referenceId?: string;
  referenceType?: string;
  accountId?: string;
  accountName?: string;
  transactionId?: string;
  createdAt?: string | Date | number;
  updatedAt?: string | Date | number;
}): IExpense => {
  const hasReferenceId = Boolean(props.referenceId && props.referenceId.trim().length > 0);
  const hasReferenceType = Boolean(props.referenceType && props.referenceType.trim().length > 0);

  if (hasReferenceId !== hasReferenceType) {
    throw createValidationError('Both referenceId and referenceType are required when referencing an entity');
  }

  const now = new Date();
  const categoryVO = ExpenseCategoryVO.create(props.category);
  const referenceTypeVO = props.referenceType ? ExpenseReferenceTypeVO.create(props.referenceType) : undefined;

  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    amount: PositiveNumberVO.create(props.amount),
    description: NonEmptyStringVO.create(props.description),
    category: categoryVO,
    contextId: props.contextId ? IdVO.create(props.contextId) : undefined,
    referenceId: props.referenceId ? IdVO.create(props.referenceId) : undefined,
    referenceType: referenceTypeVO,
    accountId: props.accountId ? IdVO.create(props.accountId) : undefined,
    accountName: props.accountName ? NonEmptyStringVO.create(props.accountName) : undefined,
    transactionId: props.transactionId ? IdVO.create(props.transactionId) : undefined,
    createdAt: DateTimeVO.create(props.createdAt || now),
    updatedAt: DateTimeVO.create(props.updatedAt || now),
  };
};

export const attachTransactionToExpense = (expense: IExpense, transactionId: Id): IExpense => {
  if (expense.transactionId) {
    if (expense.transactionId.toString() === transactionId.toString()) {
      return expense;
    }
    throw createValidationError('Expense is already attached to a transaction');
  }
  return {
    ...expense,
    transactionId,
    updatedAt: DateTimeVO.create(new Date()),
  };
};
