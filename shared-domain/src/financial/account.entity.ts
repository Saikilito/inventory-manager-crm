import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { Currency, CurrencyVO } from '../shared/value-objects/currency.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';

export interface IAccount {
  id?: Id;
  name: NonEmptyString;
  currency: Currency;
  balance: number;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export const makeAccount = (props: {
  id?: string;
  name: string;
  currency: string;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
}): IAccount => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    name: NonEmptyStringVO.create(props.name),
    currency: CurrencyVO.create(props.currency),
    balance: props.balance !== undefined ? props.balance : 0,
    createdAt: DateTimeVO.create(props.createdAt),
    updatedAt: DateTimeVO.create(props.updatedAt),
  };
};
