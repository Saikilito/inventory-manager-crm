import { z } from 'zod';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError, createValidationError } from '../validation-error.js';

export type NonNegativeNumber = Opaque<number, 'NonNegativeNumber'>;

export const NonNegativeNumberVO = {
  create: (value: number) => {
    const result = NonNegativeNumberVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: number): Result<NonNegativeNumber, ValidationError> => {
    if (z.number().min(0).safeParse(value).error) {
      return Result.fail(
        createValidationError(`Value ${value} must be a non-negative number`),
      );
    }

    return Result.ok(value as NonNegativeNumber);
  },
};
