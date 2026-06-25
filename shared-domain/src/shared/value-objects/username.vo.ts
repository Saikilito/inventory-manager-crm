import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError } from '../validation-error.js';
import { NonEmptyStringVO } from './non-empty-string.vo.js';

export type Username = Opaque<string, 'Username'>;

export const UsernameVO = {
  create: (str: string) => {
    const result = UsernameVO.createResult(str);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (str: string): Result<Username, ValidationError> => {
    const nonEmptyResult = NonEmptyStringVO.createResult(str);
    if (nonEmptyResult.isFailure) {
      return Result.fail(nonEmptyResult.getError());
    }

    const value = nonEmptyResult.getValue() as string;
    if (/\s/.test(value)) {
      return Result.fail(new ValidationError('Username cannot contain spaces'));
    }

    return Result.ok(value as Username);
  },
};
