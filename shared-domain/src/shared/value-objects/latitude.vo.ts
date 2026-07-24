import { z } from 'zod';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError, createValidationError } from '../validation-error.js';

export type Latitude = Opaque<number, 'Latitude'>;

export const LatitudeVO = {
  create: (value: number) => {
    const result = LatitudeVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: number): Result<Latitude, ValidationError> => {
    if (z.number().min(-90).max(90).safeParse(value).error) {
      return Result.fail(createValidationError('Latitude must be between -90 and 90'));
    }

    return Result.ok(value as Latitude);
  },
};
