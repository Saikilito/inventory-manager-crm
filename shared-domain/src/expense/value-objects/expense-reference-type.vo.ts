import { Result } from '../../shared/result.js';
import { Opaque } from '../../shared/opaque.js';
import { ValidationError, createValidationError } from '../../shared/validation-error.js';

export const ExpenseReferenceType = Object.freeze({
  PRODUCT: 'PRODUCT',
  SELLER: 'SELLER',
  FIXED_EXPENSE: 'FIXED_EXPENSE',
} as const);

export type ExpenseReferenceType = (typeof ExpenseReferenceType)[keyof typeof ExpenseReferenceType];

export type ExpenseReferenceTypeType = Opaque<ExpenseReferenceType, 'ExpenseReferenceTypeType'>;

export const ExpenseReferenceTypeVO = {
  create: (value: string): ExpenseReferenceTypeType => {
    const result = ExpenseReferenceTypeVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: string): Result<ExpenseReferenceTypeType, ValidationError> => {
    if (typeof value !== 'string') {
      return Result.fail(createValidationError('ExpenseReferenceType must be a string'));
    }

    const normalized = value.toUpperCase().trim();
    const isValid = (Object.values(ExpenseReferenceType) as string[]).includes(normalized);

    if (!isValid) {
      return Result.fail(
        createValidationError(
          `Invalid expense reference type: ${value}. Allowed values: ${Object.values(ExpenseReferenceType).join(', ')}`,
        ),
      );
    }

    return Result.ok(normalized as ExpenseReferenceTypeType);
  },

  equals: (voA: ExpenseReferenceTypeType | string, voB: ExpenseReferenceTypeType | string): boolean => voA === voB,

  getAll: (): readonly ExpenseReferenceType[] => Object.values(ExpenseReferenceType),
};
