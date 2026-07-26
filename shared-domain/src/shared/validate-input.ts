import { z } from 'zod';
import { Result } from './result.js';
import { ValidationError, createValidationError } from './errors.js';

export const validateInput = <T extends z.ZodType>(schema: T, input: unknown): Result<z.infer<T>, ValidationError> => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return Result.fail(createValidationError(parsed.error.issues.map((i) => i.message).join(', ')));
  }
  return Result.ok(parsed.data);
};
