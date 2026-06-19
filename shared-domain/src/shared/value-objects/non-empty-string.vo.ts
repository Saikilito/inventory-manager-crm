import { z } from 'zod';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError } from '../validation-error.js';

export type NonEmptyString = Opaque<string, 'NonEmptyString'>;

export const NonEmptyStringVO = {
  create: (str: string) => {
    const result = NonEmptyStringVO.createResult(str);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (str: string): Result<NonEmptyString, ValidationError> => {
    const clearStr = str.trim();

    if (z.string().nonempty().safeParse(clearStr).error) {
      return Result.fail(new ValidationError('Empty String is not allowed'));
    }

    return Result.ok(clearStr as NonEmptyString);
  },
};
