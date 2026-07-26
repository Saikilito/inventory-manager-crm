import { Result } from '../shared/result.js';
import { Opaque } from '../shared/opaque.js';
import { ValidationError, createValidationError } from '../shared/validation-error.js';

export const TransactionSource = Object.freeze({
  ORDER_PAYMENT: 'ORDER_PAYMENT',
  ORDER_REFUND: 'ORDER_REFUND',
  EXPENSE: 'EXPENSE',
  EXPENSE_REVERSAL: 'EXPENSE_REVERSAL',
  FIXED_EXPENSE_PAYMENT: 'FIXED_EXPENSE_PAYMENT',
  TRANSFER: 'TRANSFER',
  MANUAL: 'MANUAL',
  DELIVERY: 'DELIVERY',
  STOCK_PURCHASE: 'STOCK_PURCHASE',
} as const);

export type TransactionSource = (typeof TransactionSource)[keyof typeof TransactionSource];

export type TransactionSourceType = Opaque<TransactionSource, 'TransactionSourceType'>;

export const TransactionSourceVO = {
  create: (value: string): TransactionSourceType => {
    const result = TransactionSourceVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: string): Result<TransactionSourceType, ValidationError> => {
    if (typeof value !== 'string') {
      return Result.fail(createValidationError('TransactionSource must be a string'));
    }

    const normalized = value.toUpperCase().trim();
    const isValid = (Object.values(TransactionSource) as string[]).includes(normalized);

    if (!isValid) {
      return Result.fail(
        createValidationError(
          `Invalid transaction source: ${value}. Allowed values: ${Object.values(TransactionSource).join(', ')}`,
        ),
      );
    }

    return Result.ok(normalized as TransactionSourceType);
  },

  equals: (voA: TransactionSourceType | string, voB: TransactionSourceType | string): boolean => voA === voB,

  getAll: (): readonly TransactionSource[] => Object.values(TransactionSource),
};

export const isTransactionSource = (value: string): value is TransactionSource => {
  return typeof value === 'string' && (Object.values(TransactionSource) as string[]).includes(value.toUpperCase().trim());
};
