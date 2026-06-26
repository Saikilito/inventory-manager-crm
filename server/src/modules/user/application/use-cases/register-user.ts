import { makeUser } from '../../../../../../shared-domain/src/user/user.entity.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IUserRepository } from '../repositories/user.repository.js';

export interface RegisterUserInput {
  user: string;
  email: string;
  name: string;
  password?: string;
  role: string;
}

export type RegisterUser = (input: RegisterUserInput) => Promise<Result<void, Error>>;

export const makeRegisterUser = (userRepository: IUserRepository): RegisterUser => {
  return async (input: RegisterUserInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('user', () => makeUser(input))
      .useResult('existingEmail', ({ user }) =>
        userRepository.getOne([{
          field: NonEmptyStringVO.create('email'),
          value: user.email,
          operator: '=',
        }])
      )
      .useResult('existingUser', ({ user }) =>
        userRepository.getOne([{
          field: NonEmptyStringVO.create('user'),
          value: user.user,
          operator: '=',
        }])
      )
      .useResult('validateUnique', ({ existingEmail, existingUser }) => {
        if (existingEmail !== null) {
          return Result.fail(new Error('Email is already registered'));
        }
        if (existingUser !== null) {
          return Result.fail(new Error('Username is already registered'));
        }
        return Result.ok();
      })
      .useResult('save', ({ user }) => userRepository.create(user, IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, Error>();
  };
};
