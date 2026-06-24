import { AuthRepository } from '../../domain/auth.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IUser } from '@shared-domain/user/user.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface RegisterUseCase {
  execute(user: IUser): Promise<Result<string, DomainError>>;
}

export function makeRegisterUseCase(repository: AuthRepository): RegisterUseCase {
  return {
    execute: (user) => repository.register(user),
  };
}
