import { z } from 'zod';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError } from '../validation-error.js';

export type Email = Opaque<string, 'Email'>;

export const EmailVO = {
  create: (str: string) => {
    const result = EmailVO.createResult(str);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (str: string): Result<Email, ValidationError> => {
    const emailSchema = z.string().email().safeParse(str);
    if (emailSchema.error) {
      return Result.fail(
        new ValidationError(
          `Invalid email: ${str}: ${emailSchema.error.message}`,
        ),
      );
    }

    return Result.ok(str as Email);
  },
};
