import { z } from 'zod';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError, createValidationError } from '../validation-error.js';

export type Cedula = Opaque<string, 'Cedula'>;

export const CedulaVO = {
  create: (value: string) => {
    const result = CedulaVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: string): Result<Cedula, ValidationError> => {
    if (z.string().regex(/^[VE]-\d{7,9}$/).safeParse(value).error) {
      return Result.fail(createValidationError('Invalid Cédula format'));
    }

    return Result.ok(value as Cedula);
  },
};
