import { AuthRepository } from '../../domain/auth.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface LoginUseCase {
  execute(email: string, password: string): Promise<Result<string, DomainError>>;
}

export function makeLoginUseCase(repository: AuthRepository): LoginUseCase {
  return {
    execute: (email, password) => repository.login(email, password),
  };
}
