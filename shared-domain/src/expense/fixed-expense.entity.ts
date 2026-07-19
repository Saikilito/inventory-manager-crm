import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { ExpenseCategory } from './expense.entity.js';

export interface IFixedExpense {
  id?: Id;
  name: NonEmptyString;
  category: ExpenseCategory;
  amount: PositiveNumber;
  isActive: boolean;
  contextId?: Id;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export interface IFixedExpensePayment {
  id?: Id;
  fixedExpenseId: Id;
  billingMonth: NonEmptyString;
  isPaid: boolean;
  amountPaid: PositiveNumber;
  paidAt?: DateTime;
  generatedExpenseId?: Id;
  contextId?: Id;
}

export const makeFixedExpense = (props: {
  id?: string;
  name: string;
  category: string;
  amount: number;
  isActive?: boolean;
  contextId?: string;
  createdAt?: string | Date | number;
  updatedAt?: string | Date | number;
}): IFixedExpense => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    name: NonEmptyStringVO.create(props.name),
    category: props.category as ExpenseCategory,
    amount: PositiveNumberVO.create(props.amount),
    isActive: props.isActive !== false,
    contextId: props.contextId ? IdVO.create(props.contextId) : undefined,
    createdAt: props.createdAt ? DateTimeVO.create(props.createdAt) : undefined,
    updatedAt: props.updatedAt ? DateTimeVO.create(props.updatedAt) : undefined,
  };
};

export const makeFixedExpensePayment = (props: {
  id?: string;
  fixedExpenseId: string;
  billingMonth: string;
  isPaid?: boolean;
  amountPaid: number;
  paidAt?: string | Date | number;
  generatedExpenseId?: string;
  contextId?: string;
}): IFixedExpensePayment => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    fixedExpenseId: IdVO.create(props.fixedExpenseId),
    billingMonth: NonEmptyStringVO.create(props.billingMonth),
    isPaid: props.isPaid === true,
    amountPaid: PositiveNumberVO.create(props.amountPaid),
    paidAt: props.paidAt ? DateTimeVO.create(props.paidAt) : undefined,
    generatedExpenseId: props.generatedExpenseId ? IdVO.create(props.generatedExpenseId) : undefined,
    contextId: props.contextId ? IdVO.create(props.contextId) : undefined,
  };
};
