import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';

export const ExpenseCategory = {
  REPLENISHMENT: 'REPLENISHMENT',
  SALARY: 'SALARY',
  RENT: 'RENT',
  UTILITIES: 'UTILITIES',
  MARKETING: 'MARKETING',
  TRANSPORTATION: 'TRANSPORTATION',
  TAX: 'TAX',
  OTHER: 'OTHER',
} as const;
export type ExpenseCategory = typeof ExpenseCategory[keyof typeof ExpenseCategory];

export const ExpenseReferenceType = {
  PRODUCT: 'PRODUCT',
  SELLER: 'SELLER',
  FIXED_EXPENSE: 'FIXED_EXPENSE',
} as const;
export type ExpenseReferenceType = typeof ExpenseReferenceType[keyof typeof ExpenseReferenceType];

export interface IExpense {
  id?: Id;
  amount: PositiveNumber;
  description: NonEmptyString;
  category: ExpenseCategory;
  contextId?: Id;
  referenceId?: Id;
  referenceType?: ExpenseReferenceType;
  accountId?: Id;
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
  transactionId?: string;
  createdAt?: string | Date | number;
  updatedAt?: string | Date | number;
}): IExpense => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    amount: PositiveNumberVO.create(props.amount),
    description: NonEmptyStringVO.create(props.description),
    category: props.category as ExpenseCategory,
    contextId: props.contextId ? IdVO.create(props.contextId) : undefined,
    referenceId: props.referenceId ? IdVO.create(props.referenceId) : undefined,
    referenceType: props.referenceType as ExpenseReferenceType | undefined,
    accountId: props.accountId ? IdVO.create(props.accountId) : undefined,
    transactionId: props.transactionId ? IdVO.create(props.transactionId) : undefined,
    createdAt: props.createdAt ? DateTimeVO.create(props.createdAt) : undefined,
    updatedAt: props.updatedAt ? DateTimeVO.create(props.updatedAt) : undefined,
  };
};
