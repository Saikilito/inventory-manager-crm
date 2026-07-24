import { z } from 'zod';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError, createValidationError } from '../validation-error.js';

export type BillingMonth = Opaque<string, 'BillingMonth'>;

export const BillingMonthVO = {
  create: (value: string) => {
    const result = BillingMonthVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: string): Result<BillingMonth, ValidationError> => {
    if (z.string().regex(/^\d{4}-\d{2}$/).safeParse(value).error) {
      return Result.fail(createValidationError('Billing month must be in YYYY-MM format'));
    }

    return Result.ok(value as BillingMonth);
  },
};
