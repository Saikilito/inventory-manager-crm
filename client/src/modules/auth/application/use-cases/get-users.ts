import { AuthRepository } from '../../domain/auth.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IUser } from '@shared-domain/user/user.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface GetUsersUseCase {
  execute(): Promise<Result<IUser[], DomainError>>;
}

export function makeGetUsersUseCase(repository: AuthRepository): GetUsersUseCase {
  return {
    execute: () => repository.getUsers(),
  };
}
