import { z } from 'zod';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError, createValidationError } from '../validation-error.js';

export type WhatsappId = Opaque<string, 'WhatsappId'>;

export const WhatsappIdVO = {
  create: (value: string) => {
    const result = WhatsappIdVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: string): Result<WhatsappId, ValidationError> => {
    if (z.string().regex(/^\+\d{10,15}$/).safeParse(value).error) {
      return Result.fail(createValidationError('Invalid WhatsApp ID format'));
    }

    return Result.ok(value as WhatsappId);
  },
};
