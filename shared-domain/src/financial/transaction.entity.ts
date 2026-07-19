import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { Currency, CurrencyVO } from '../shared/value-objects/currency.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { DateOnly, DateOnlyVO } from '../shared/value-objects/date-only.vo.js';

export const TransactionType = {
  CREDIT: 'CREDIT', // Balance increases
  DEBIT: 'DEBIT',   // Balance decreases
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export interface ITransaction {
  id?: Id;
  accountId: Id;
  type: TransactionType;
  amount: PositiveNumber;
  currency: Currency;
  description: NonEmptyString;
  date: DateOnly;
  financialDayId: Id;
  referenceId?: Id;
  createdAt: DateTime;
}

export const makeTransaction = (props: {
  id?: string;
  accountId: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  date: string | Date;
  financialDayId: string;
  referenceId?: string;
  createdAt?: string;
}): ITransaction => {
  const parsedType = props.type.toUpperCase() as TransactionType;
  if (parsedType !== TransactionType.CREDIT && parsedType !== TransactionType.DEBIT) {
    throw new Error(`Unsupported transaction type: ${props.type}`);
  }

  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    accountId: IdVO.create(props.accountId),
    type: parsedType,
    amount: PositiveNumberVO.create(props.amount),
    currency: CurrencyVO.create(props.currency),
    description: NonEmptyStringVO.create(props.description),
    date: DateOnlyVO.create(props.date),
    financialDayId: IdVO.create(props.financialDayId),
    referenceId: props.referenceId ? IdVO.create(props.referenceId) : undefined,
    createdAt: DateTimeVO.create(props.createdAt),
  };
};
