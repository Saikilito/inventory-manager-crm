import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { Currency, CurrencyVO } from '../shared/value-objects/currency.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { DateOnly, DateOnlyVO } from '../shared/value-objects/date-only.vo.js';
import { TransactionSource, TransactionSourceVO, type TransactionSourceType } from './transaction-source.vo.js';

import { Result } from '../shared/result.js';
import { ResultComposer } from '../shared/result-composer.js';
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
  source: TransactionSourceType;
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
  const composerResult = ResultComposer.start()
    .useResult('typeCheck', () => {
      if (!props.type || typeof props.type !== 'string') {
        return Result.fail(createValidationError('Transaction type must be a non-empty string'));
      }
      const parsedType = props.type.toUpperCase() as TransactionType;
      if (parsedType !== TransactionType.CREDIT && parsedType !== TransactionType.DEBIT) {
        return Result.fail(createValidationError(`Unsupported transaction type: ${props.type}`));
      }
      return Result.ok(parsedType);
    })
    .useResult('source', () =>
      TransactionSourceVO.createResult(props.source || TransactionSource.MANUAL),
    )
    .useResult('sourceRefCheck', ({ source }) => {
      if (source !== TransactionSource.MANUAL) {
        if (!props.sourceReferenceId || props.sourceReferenceId.trim().length === 0) {
          return Result.fail(
            createValidationError(`sourceReferenceId is required when transaction source is ${source}`),
          );
        }
      }
      return Result.ok(true);
    })
    .useResult('id', () => (props.id ? IdVO.createResult(props.id) : Result.ok(undefined)))
    .useResult('accountId', () => IdVO.createResult(props.accountId))
    .useResult('amount', () => PositiveNumberVO.createResult(props.amount))
    .useResult('currency', () => CurrencyVO.createResult(props.currency))
    .useResult('description', () => NonEmptyStringVO.createResult(props.description))
    .useResult('date', () => DateOnlyVO.createResult(props.date))
    .useResult('financialDayId', () => IdVO.createResult(props.financialDayId))
    .useResult('sourceReferenceId', () =>
      props.sourceReferenceId ? IdVO.createResult(props.sourceReferenceId) : Result.ok(undefined),
    )
    .useResult('createdAt', () =>
      props.createdAt
        ? DateTimeVO.createResult(props.createdAt)
        : DateTimeVO.createResult(new Date()),
    )
    .runSync<ValidationError>();

  if (composerResult.isFailure) {
    return Result.fail(composerResult.getError());
  }

  const {
    id,
    accountId,
    typeCheck: parsedType,
    amount,
    currency,
    description,
    date,
    financialDayId,
    source,
    sourceReferenceId,
    createdAt,
  } = composerResult.getValue();

  return Result.ok({
    id,
    accountId,
    type: parsedType,
    amount,
    currency,
    description,
    date,
    financialDayId,
    source,
    sourceReferenceId,
    createdAt,
  });
};
