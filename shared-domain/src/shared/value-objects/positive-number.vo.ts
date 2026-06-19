import { z } from 'zod';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError } from '../validation-error.js';

export type PositiveNumber = Opaque<number, 'PositiveNumber'>;

export const PositiveNumberVO = {
  create: (value: number) => {
    const result = PositiveNumberVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: number): Result<PositiveNumber, ValidationError> => {
    if (z.number().min(1).safeParse(value).error) {
      return Result.fail(
        new ValidationError(`Value ${value} must be a positive number`),
      );
    }

    return Result.ok(value as PositiveNumber);
  },
};
