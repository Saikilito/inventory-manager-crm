import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { Currency, CurrencyVO } from '../shared/value-objects/currency.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { Result } from '../shared/result.js';
import { ValidationError, createValidationError } from '../shared/validation-error.js';

export interface IAccount {
  id?: Id;
  name: NonEmptyString;
  currency: Currency;
  balance: number;
  createdAt: DateTime;
  updatedAt: DateTime;
  isSame: (other: IAccount) => boolean;
  canDebit: (amount: PositiveNumber) => boolean;
  debit: (amount: PositiveNumber) => IAccount;
  credit: (amount: PositiveNumber) => IAccount;
  calculateCreditFor: (
    target: IAccount,
    amount: PositiveNumber,
    exchangeRate?: PositiveNumber
  ) => Result<PositiveNumber, ValidationError>;
}

export const makeAccount = (props: {
  id?: string;
  name: string;
  currency: string;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
}): IAccount => {
  const account = {
    id: props.id ? IdVO.create(props.id) : undefined,
    name: NonEmptyStringVO.create(props.name),
    currency: CurrencyVO.create(props.currency),
    balance: props.balance !== undefined ? props.balance : 0,
    createdAt: DateTimeVO.create(props.createdAt),
    updatedAt: DateTimeVO.create(props.updatedAt),
  } as const;

  return {
    ...account,
    isSame(this: IAccount, other: IAccount): boolean {
      if (!this.id || !other.id) return false;
      return this.id.toString() === other.id.toString();
    },
    canDebit(this: IAccount, amount: PositiveNumber): boolean {
      return this.balance >= amount;
    },
    debit(this: IAccount, amount: PositiveNumber): IAccount {
      return makeAccount({
        ...props,
        id: this.id?.toString(),
        balance: this.balance - amount,
      });
    },
    credit(this: IAccount, amount: PositiveNumber): IAccount {
      return makeAccount({
        ...props,
        id: this.id?.toString(),
        balance: this.balance + amount,
      });
    },
    calculateCreditFor(
      this: IAccount,
      target: IAccount,
      amount: PositiveNumber,
      exchangeRate?: PositiveNumber
    ): Result<PositiveNumber, ValidationError> {
      const isSameCurrency = this.currency.toString() === target.currency.toString();

      if (isSameCurrency) return Result.ok(amount);

      if (!exchangeRate) {
        return Result.fail(
          createValidationError('Exchange rate required for multi-currency transfers')
        );
      }

      return PositiveNumberVO.createResult(amount * exchangeRate);
    },
  };
};

export const isInsufficientAccountBalance = (
  account: { balance: number } | null | undefined,
  amount: number
): boolean => {
  if (!account || amount <= 0) return false;
  return account.balance < amount;
};
