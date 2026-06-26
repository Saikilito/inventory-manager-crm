import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IUser } from '../../../../../../shared-domain/src/user/user.entity.js';
import { IUserRepository } from '../repositories/user.repository.js';

export type GetAllUsers = () => Promise<Result<IUser[], Error>>;

export const makeGetAllUsers = (userRepository: IUserRepository): GetAllUsers => {
  return async () => {
    const res = await userRepository.getAll();
    if (res.isFailure) {
      return Result.fail(new Error(res.getError().message));
    }
    return Result.ok(res.getValue().items);
  };
};
