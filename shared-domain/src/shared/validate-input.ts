import { z } from 'zod';
import { Result } from './result.js';
import { ValidationError } from './validation-error.js';

/**
 * Validates Zod schema input and returns a Result.
 * Eliminates the repeated safeParse → ValidationError pattern across use cases.
 *
 * @example
 * const input = validateInput(createKnowledgeInputSchema, rawInput);
 * if (input.isFailure) return input;
 * // input.getValue() is now typed and validated
 */
export const validateInput = <T extends z.ZodType>(
  schema: T,
  input: unknown,
): Result<z.infer<T>, ValidationError> => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return Result.fail(
      new ValidationError(parsed.error.issues.map((i) => i.message).join(', ')),
    );
  }
  return Result.ok(parsed.data);
};
