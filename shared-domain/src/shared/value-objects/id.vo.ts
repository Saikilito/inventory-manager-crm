import { validate, v4 as uuid, NIL as NIL_UUID } from 'uuid';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError, createValidationError } from '../validation-error.js';

export type Id = Opaque<string, 'Id'>;

export const IdVO = {
  generate: () => IdVO.create(uuid()),

  generateNil: () => IdVO.create(NIL_UUID),

  create: (str: string) => {
    const result = IdVO.createResult(str);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (str: string): Result<Id, ValidationError> => {
    const isUuid = validate(str);
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(str);

    if (!isUuid && !isObjectId) {
      return Result.fail(createValidationError('UUID is not valid'));
    }

    return Result.ok(str as Id);
  },
};
