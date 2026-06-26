import { describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { IUser, makeUser } from '../../../../../../../shared-domain/src/user/user.entity.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IUserRepository } from '../../repositories/user.repository.js';
import { makeGetUserByEmail } from '../get-user.js';
import { makeRegisterUser } from '../register-user.js';
import { makeAuthenticateUser } from '../authenticate-user.js';
import { makeGetAllUsers } from '../get-all-users.js';
import { makeUpdateUser } from '../update-user.js';
import { WhereField } from '../../../../../../../shared-domain/src/shared/repository.js';
import { NonEmptyStringVO } from '../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const hashedPassword = await bcrypt.hash('secret_password_123', 10);

const userMother = {
  create(overrides: Partial<{ id: string; user: string; email: string; name: string; password?: string; role: string }> = {}): IUser {
    const result = makeUser({
      id: overrides.id ?? VALID_UUID,
      user: overrides.user ?? 'test_user',
      email: overrides.email ?? 'test@example.com',
      name: overrides.name ?? 'Seller Saikilo',
      password: overrides.password ?? hashedPassword,
      role: overrides.role ?? 'SELLER',
    });
    if (result.isFailure) {
      throw result.getError();
    }
    return result.getValue();
  }
};

const makeMockUserRepository = (initialUsers: IUser[] = []): IUserRepository => {
  const store = new Map<string, IUser>();
  if (initialUsers.length === 0) {
    const initial = userMother.create();
    store.set(String(initial.email), initial);
  } else {
    for (const u of initialUsers) {
      store.set(String(u.email), u);
    }
  }

  return {
    async getOne(where: WhereField[]): Promise<Result<IUser | null, any>> {
      const emailField = where.find(f => String(f.field) === 'email');
      if (emailField) {
        for (const user of store.values()) {
          if (String(user.email) === String(emailField.value)) {
            return Result.ok(user);
          }
        }
        return Result.ok(null);
      }

      const userField = where.find(f => String(f.field) === 'user');
      if (userField) {
        for (const user of store.values()) {
          if (String(user.user) === String(userField.value)) {
            return Result.ok(user);
          }
        }
        return Result.ok(null);
      }

      return Result.ok(null);
    },

    async getById(id: any): Promise<Result<IUser | null, any>> {
      for (const user of store.values()) {
        if (String(user.id) === String(id)) {
          return Result.ok(user);
        }
      }
      return Result.ok(null);
    },

    async getAll(): Promise<Result<any, any>> {
      return Result.ok({ items: Array.from(store.values()) });
    },

    async updateById(id: any, input: any): Promise<Result<void, any>> {
      for (const [email, user] of store.entries()) {
        if (String(user.id) === String(id)) {
          store.set(email, { ...user, ...input });
          return Result.ok(undefined);
        }
      }
      return Result.ok(undefined);
    },

    async create(user: any): Promise<Result<any, any>> {
      store.set(String(user.email), user);
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
    expect(result.getValue()!.name).toBe('Seller Saikilo');
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
      user: 'new_user',
      email: 'new@example.com',
      name: 'New Seller',
      password: 'password123',
      role: 'SELLER'
    });

    expect(result.isFailure).toBe(false);

    const check = await repo.getOne([{ field: NonEmptyStringVO.create('email'), value: 'new@example.com', operator: '=' }]);
    expect(check.getValue()).toBeDefined();
    expect(check.getValue()!.name).toBe('New Seller');
  });

  it('should fail to register a user if email is already taken (RegisterUser)', async () => {
    const repo = makeMockUserRepository();
    const registerUser = makeRegisterUser(repo);

    const result = await registerUser({
      user: 'new_user',
      email: 'test@example.com', // Already pre-populated
      name: 'Duplicate Seller',
      password: 'password123',
      role: 'SELLER'
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toBe('Email is already registered');
  });

  it('should fail to register a user if username is already taken (RegisterUser)', async () => {
    const repo = makeMockUserRepository();
    const registerUser = makeRegisterUser(repo);

    const result = await registerUser({
      user: 'test_user', // Already pre-populated
      email: 'new@example.com',
      name: 'Duplicate Seller',
      password: 'password123',
      role: 'SELLER'
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toBe('Username is already registered');
  });

  it('should fail to register if username contains spaces (RegisterUser)', async () => {
    const repo = makeMockUserRepository();
    const registerUser = makeRegisterUser(repo);

    const result = await registerUser({
      user: 'invalid user with spaces',
      email: 'valid@example.com',
      name: 'Invalid User',
      password: 'password123',
      role: 'SELLER'
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toBe('Username cannot contain spaces');
  });

  it('should fail to register if email format is invalid (RegisterUser)', async () => {
    const repo = makeMockUserRepository();
    const registerUser = makeRegisterUser(repo);

    const result = await registerUser({
      user: 'valid_user',
      email: 'invalid-email-format',
      name: 'Invalid User',
      password: 'password123',
      role: 'SELLER'
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

  it('should successfully authenticate user with username (AuthenticateUser)', async () => {
    const repo = makeMockUserRepository();
    const authenticateUser = makeAuthenticateUser(repo);

    const result = await authenticateUser({
      email: 'test_user',
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

  it('should fail authentication if user account is disabled (AuthenticateUser)', async () => {
    const disabledUser = userMother.create({ email: 'disabled@example.com', user: 'disabled_user', id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d' });
    disabledUser.disabled = true;
    const repo = makeMockUserRepository([disabledUser]);
    const authenticateUser = makeAuthenticateUser(repo);

    const result = await authenticateUser({
      email: 'disabled@example.com',
      password: 'secret_password_123'
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toBe('ACCOUNT_DISABLED');
  });

  it('should successfully get all users (GetAllUsers)', async () => {
    const defaultUser = userMother.create();
    const user2 = userMother.create({ email: 'user2@example.com', user: 'user_two', id: '2a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d' });
    const repo = makeMockUserRepository([defaultUser, user2]);
    const getAllUsers = makeGetAllUsers(repo);

    const result = await getAllUsers();
    expect(result.isFailure).toBe(false);
    expect(result.getValue().length).toBe(2);
  });

  it('should successfully update user details (UpdateUser)', async () => {
    const actorId = '550e8400-e29b-41d4-a716-446655440000';
    const targetId = '2a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';
    const targetUser = userMother.create({ email: 'user2@example.com', user: 'user_two', id: targetId });
    const repo = makeMockUserRepository([targetUser]);
    const updateUser = makeUpdateUser(repo);

    const result = await updateUser(actorId, targetId, { name: 'Updated Name', disabled: true });
    expect(result.isFailure).toBe(false);

    const updatedUserRes = await repo.getById(IdVO.create(targetId));
    expect(updatedUserRes.getValue()!.name.toString()).toBe('Updated Name');
    expect(updatedUserRes.getValue()!.disabled).toBe(true);
  });

  it('should prevent self lockout (UpdateUser)', async () => {
    const actorId = '550e8400-e29b-41d4-a716-446655440000';
    const repo = makeMockUserRepository();
    const updateUser = makeUpdateUser(repo);

    const result = await updateUser(actorId, actorId, { disabled: true });
    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toBe('SELF_LOCKOUT_PREVENTED');
  });

  it('should prevent self demotion from ADMIN (UpdateUser)', async () => {
    const actorId = '550e8400-e29b-41d4-a716-446655440000';
    const adminUser = userMother.create({ id: actorId, role: 'ADMIN', email: 'admin@example.com', user: 'admin_user' });
    const repo = makeMockUserRepository([adminUser]);
    const updateUser = makeUpdateUser(repo);

    const result = await updateUser(actorId, actorId, { role: 'SELLER' });
    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toBe('SELF_DEMOTION_PREVENTED');
  });
});
