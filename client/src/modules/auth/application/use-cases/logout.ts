import { AuthRepository } from '../../domain/auth.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface LogoutUseCase {
  execute(): Promise<Result<void, DomainError>>;
}

export function makeLogoutUseCase(repository: AuthRepository): LogoutUseCase {
  return {
    execute: () => repository.logout(),
  };
}
