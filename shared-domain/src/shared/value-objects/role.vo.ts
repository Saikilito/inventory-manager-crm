import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError, createValidationError } from '../validation-error.js';

export const UserRole = {
  ADMIN: 'ADMIN',
  SELLER: 'SELLER',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export type Role = Opaque<UserRole, 'Role'>;

export const RoleVO = {
  create: (str: string) => {
    const result = RoleVO.createResult(str);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (str: string): Result<Role, ValidationError> => {
    const upperStr = String(str).toUpperCase().trim();

    if (upperStr !== UserRole.ADMIN && upperStr !== UserRole.SELLER) {
      return Result.fail(
        createValidationError(
          `Invalid role: ${str}. Allowed roles are ADMIN, SELLER.`,
        ),
      );
    }

    return Result.ok(upperStr as Role);
  },
};
