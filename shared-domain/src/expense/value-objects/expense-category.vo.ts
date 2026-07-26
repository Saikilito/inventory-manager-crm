import { Result } from '../../shared/result.js';
import { Opaque } from '../../shared/opaque.js';
import { ValidationError, createValidationError } from '../../shared/validation-error.js';

export const ExpenseCategory = Object.freeze({
  REPLENISHMENT: 'REPLENISHMENT',
  SALARY: 'SALARY',
  RENT: 'RENT',
  UTILITIES: 'UTILITIES',
  MARKETING: 'MARKETING',
  TRANSPORTATION: 'TRANSPORTATION',
  TAX: 'TAX',
  OTHER: 'OTHER',
} as const);

export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export type ExpenseCategoryType = Opaque<ExpenseCategory, 'ExpenseCategoryType'>;

export const ExpenseCategoryVO = {
  create: (value: string): ExpenseCategoryType => {
    const result = ExpenseCategoryVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: string): Result<ExpenseCategoryType, ValidationError> => {
    if (typeof value !== 'string') {
      return Result.fail(createValidationError('ExpenseCategory must be a string'));
    }

    const normalized = value.toUpperCase().trim();
    const isValid = (Object.values(ExpenseCategory) as string[]).includes(normalized);

    if (!isValid) {
      return Result.fail(
        createValidationError(
          `Invalid expense category: ${value}. Allowed values: ${Object.values(ExpenseCategory).join(', ')}`,
        ),
      );
    }

    return Result.ok(normalized as ExpenseCategoryType);
  },

  equals: (voA: ExpenseCategoryType | string, voB: ExpenseCategoryType | string): boolean => voA === voB,

  getAll: (): readonly ExpenseCategory[] => Object.values(ExpenseCategory),
};
