import { AuthRepository } from '../../domain/auth.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IUser } from '@shared-domain/user/user.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface GetCurrentUserUseCase {
  execute(): Promise<Result<IUser | null, DomainError>>;
}

export function makeGetCurrentUserUseCase(repository: AuthRepository): GetCurrentUserUseCase {
  return {
    execute: () => repository.getCurrentUser(),
  };
}
