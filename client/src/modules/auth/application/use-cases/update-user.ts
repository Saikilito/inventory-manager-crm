import { AuthRepository } from '../../domain/auth.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IUser } from '@shared-domain/user/user.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface UpdateUserUseCase {
  execute(id: string, data: Partial<IUser>): Promise<Result<void, DomainError>>;
}

export function makeUpdateUserUseCase(repository: AuthRepository): UpdateUserUseCase {
  return {
    execute: (id, data) => repository.updateUser(id, data),
  };
}
