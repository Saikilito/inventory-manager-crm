import { describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../../shared-domain/src/shared/errors.js';
import { IUser, makeUser } from '../../../../../../../shared-domain/src/user/user.entity.js';
import { IUserRepository } from '../../repositories/user.repository.js';
import { makeGetUserByEmail } from '../get-user.js';
import { makeRegisterUser } from '../register-user.js';
import { makeAuthenticateUser } from '../authenticate-user.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const hashedPassword = await bcrypt.hash('secret_password_123', 10);

const userMother = {
  create(overrides: Partial<{ id: string; email: string; name: string; password?: string; role: string }> = {}) {
    return makeUser({
      id: overrides.id ?? VALID_UUID,
      email: overrides.email ?? 'test@example.com',
      name: overrides.name ?? 'Vendedor Saikilo',
      password: overrides.password ?? hashedPassword,
      role: overrides.role ?? 'seller',
    });
  }
};

const makeMockUserRepository = (): IUserRepository => {
  const store = new Map<string, IUser>();
  const initial = userMother.create();
  store.set(initial.email, initial);

  return {
    async getOne(where: any[]): Promise<Result<IUser | null, any>> {
      const emailField = where.find(f => f.field === 'email');
      if (emailField) {
        const user = store.get(emailField.value);
        return Result.ok(user || null);
      }
      return Result.ok(null);
    },

    async create(user: any): Promise<Result<any, any>> {
      store.set(user.email, user);
      return Result.ok(user);
    }
  } as any;
};

describe('User Use Cases (TDD)', () => {
  it('should retrieve a user by email (GetUserByEmail)', async () => {
    const repo = makeMockUserRepository();
    const getUserByEmail = makeGetUserByEmail(repo);

    const result = await getUserByEmail('test@example.com');
    expect(result.isFailure).toBe(false);
    expect(result.getValue()).toBeDefined();
    expect(result.getValue()!.name).toBe('Vendedor Saikilo');
  });

  it('should return null if user does not exist (GetUserByEmail)', async () => {
    const repo = makeMockUserRepository();
    const getUserByEmail = makeGetUserByEmail(repo);

    const result = await getUserByEmail('nonexistent@example.com');
    expect(result.isFailure).toBe(false);
    expect(result.getValue()).toBeNull();
  });

  it('should successfully register a valid, non-existent user (RegisterUser)', async () => {
    const repo = makeMockUserRepository();
    const registerUser = makeRegisterUser(repo);

    const result = await registerUser({
      email: 'new@example.com',
      name: 'Nuevo Vendedor',
      password: 'password123',
      role: 'seller'
    });

    expect(result.isFailure).toBe(false);

    const check = await repo.getOne([{ field: 'email' as any, value: 'new@example.com', operator: '=' }]);
    expect(check.getValue()).toBeDefined();
    expect(check.getValue()!.name).toBe('Nuevo Vendedor');
  });

  it('should fail to register a user if email is already taken (RegisterUser)', async () => {
    const repo = makeMockUserRepository();
    const registerUser = makeRegisterUser(repo);

    const result = await registerUser({
      email: 'test@example.com', // Already pre-populated
      name: 'Vendedor Duplicado',
      password: 'password123',
      role: 'seller'
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toBe('User already exists');
  });

  it('should fail to register if email format is invalid (RegisterUser)', async () => {
    const repo = makeMockUserRepository();
    const registerUser = makeRegisterUser(repo);

    const result = await registerUser({
      email: 'invalid-email-format',
      name: 'Invalid User',
      password: 'password123',
      role: 'seller'
    });

    expect(result.isFailure).toBe(true);
  });

  it('should successfully authenticate user with correct password (AuthenticateUser)', async () => {
    const repo = makeMockUserRepository();
    const authenticateUser = makeAuthenticateUser(repo);

    const result = await authenticateUser({
      email: 'test@example.com',
      password: 'secret_password_123'
    });

    expect(result.isFailure).toBe(false);
    expect(result.getValue().token).toBeDefined();
    expect(result.getValue().token).toBeTypeOf('string');
  });

  it('should fail authentication with incorrect password (AuthenticateUser)', async () => {
    const repo = makeMockUserRepository();
    const authenticateUser = makeAuthenticateUser(repo);

    const result = await authenticateUser({
      email: 'test@example.com',
      password: 'wrong_password'
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toBe('Incorrect password');
  });

  it('should fail authentication if user is not found (AuthenticateUser)', async () => {
    const repo = makeMockUserRepository();
    const authenticateUser = makeAuthenticateUser(repo);

    const result = await authenticateUser({
      email: 'nonexistent@example.com',
      password: 'somepassword'
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toBe('User not found');
  });
});
