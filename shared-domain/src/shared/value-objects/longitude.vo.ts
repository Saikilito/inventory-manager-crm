import { z } from 'zod';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError, createValidationError } from '../validation-error.js';

export type Longitude = Opaque<number, 'Longitude'>;

export const LongitudeVO = {
  create: (value: number) => {
    const result = LongitudeVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: number): Result<Longitude, ValidationError> => {
    if (z.number().min(-180).max(180).safeParse(value).error) {
      return Result.fail(createValidationError('Longitude must be between -180 and 180'));
    }

    return Result.ok(value as Longitude);
  },
};
