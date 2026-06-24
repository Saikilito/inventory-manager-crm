import { Result } from '@shared-domain/shared/result.js';
import { IUser } from '@shared-domain/user/user.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface AuthRepository {
  getCurrentUser(): Promise<Result<IUser | null, DomainError>>;
  login(email: string, password: string): Promise<Result<string, DomainError>>;
  register(user: IUser): Promise<Result<string, DomainError>>;
  logout(): Promise<Result<void, DomainError>>;
}
