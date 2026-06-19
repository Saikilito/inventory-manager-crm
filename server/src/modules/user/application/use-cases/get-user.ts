import { IUser } from '../../../../../../shared-domain/src/user/user.entity.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IUserRepository } from '../repositories/user.repository.js';

export type GetUserByEmail = (email: string) => Promise<Result<IUser | null, Error>>;

export const makeGetUserByEmail = (userRepository: IUserRepository): GetUserByEmail => {
  return async (email: string) => {
    const res = await userRepository.getOne([{ field: NonEmptyStringVO.create('email'), value: email, operator: '=' }]);
    if (res.isFailure) return Result.fail(new Error(res.getError().message));
    return Result.ok(res.getValue());
  };
};
