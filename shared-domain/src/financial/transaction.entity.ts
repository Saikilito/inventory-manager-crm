import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { Currency, CurrencyVO } from '../shared/value-objects/currency.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { DateOnly, DateOnlyVO } from '../shared/value-objects/date-only.vo.js';
import { TransactionSource, isTransactionSource } from './transaction-source.vo.js';

import { Result } from '../shared/result.js';
import { ValidationError, createValidationError } from '../shared/validation-error.js';

export const TransactionType = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export interface ITransaction {
  id?: Id;
  accountId: Id;
  type: TransactionType;
  amount: PositiveNumber;
  currency: Currency;
  description: NonEmptyString;
  date: DateOnly;
  financialDayId: Id;
  source: TransactionSource;
  sourceReferenceId?: Id;
  createdAt: DateTime;
}

export const makeTransactionResult = (props: {
  id?: string;
  accountId: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  date: string | Date;
  financialDayId: string;
  source?: string;
  sourceReferenceId?: string;
  createdAt?: string;
}): Result<ITransaction, ValidationError> => {
  const parsedType = props.type.toUpperCase() as TransactionType;
  if (parsedType !== TransactionType.CREDIT && parsedType !== TransactionType.DEBIT) {
    return Result.fail(createValidationError(`Unsupported transaction type: ${props.type}`));
  }

  // Default to MANUAL for legacy transactions without source
  const sourceValue = props.source || 'MANUAL';
  const parsedSource = sourceValue.toUpperCase() as TransactionSource;
  if (!isTransactionSource(parsedSource)) {
    return Result.fail(createValidationError(`Unsupported transaction source: ${sourceValue}`));
  }

  const idResult = props.id ? IdVO.createResult(props.id) : undefined;
  if (idResult && idResult.isFailure) return Result.fail(idResult.getError());

  const accountIdResult = IdVO.createResult(props.accountId);
  if (accountIdResult.isFailure) return Result.fail(accountIdResult.getError());

  const amountResult = PositiveNumberVO.createResult(props.amount);
  if (amountResult.isFailure) return Result.fail(amountResult.getError());

  const currencyResult = CurrencyVO.createResult(props.currency);
  if (currencyResult.isFailure) return Result.fail(currencyResult.getError());

  const descriptionResult = NonEmptyStringVO.createResult(props.description);
  if (descriptionResult.isFailure) return Result.fail(descriptionResult.getError());

  const dateResult = DateOnlyVO.createResult(props.date);
  if (dateResult.isFailure) return Result.fail(dateResult.getError());

  const financialDayIdResult = IdVO.createResult(props.financialDayId);
  if (financialDayIdResult.isFailure) return Result.fail(financialDayIdResult.getError());

  const sourceReferenceIdResult = props.sourceReferenceId ? IdVO.createResult(props.sourceReferenceId) : undefined;
  if (sourceReferenceIdResult && sourceReferenceIdResult.isFailure)
    return Result.fail(sourceReferenceIdResult.getError());

  const createdAtResult = props.createdAt
    ? DateTimeVO.createResult(props.createdAt)
    : DateTimeVO.createResult(new Date());
  if (createdAtResult.isFailure) return Result.fail(createdAtResult.getError());

  return Result.ok({
    id: idResult?.getValue(),
    accountId: accountIdResult.getValue(),
    type: parsedType,
    amount: amountResult.getValue(),
    currency: currencyResult.getValue(),
    description: descriptionResult.getValue(),
    date: dateResult.getValue(),
    financialDayId: financialDayIdResult.getValue(),
    source: parsedSource,
    sourceReferenceId: sourceReferenceIdResult?.getValue(),
    createdAt: createdAtResult.getValue(),
  });
};
