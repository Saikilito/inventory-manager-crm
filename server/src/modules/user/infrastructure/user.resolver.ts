import { IContext } from '../../../config/apollo.js';
import { IUser } from '../../../../../shared-domain/src/user/user.entity.js';
import { UserRole } from '../../../../../shared-domain/src/shared/value-objects/role.vo.js';

interface SetUserInput {
  user: string;
  email: string;
  name: string;
  password?: string;
  role: string;
}

interface UserAuthenticationInput {
  email: string;
  password?: string;
}

const mapToGql = (user: IUser) => {
  return {
    _id: user.id,
    user: user.user,
    email: user.email,
    name: user.name,
    role: user.role,
    disabled: user.disabled,
  };
};

interface DecodedToken {
  email: string;
}

export default {
  Query: {
    getUser: async (_parent: unknown, _args: unknown, { container, token }: IContext) => {
      const actualUser = (await token()) as DecodedToken | null;
      if (!actualUser) {
        return null;
      }

      const result = await container.user.getUserByEmail(actualUser.email);
      if (result.isFailure) {
        return null;
      }

      const user = result.getValue();
      if (!user || user.disabled === true) {
        return null;
      }
      return mapToGql(user);
    },
    getUsers: async (_parent: unknown, _args: unknown, { container, token }: IContext) => {
      const actualUserToken = (await token()) as DecodedToken | null;
      if (!actualUserToken) {
        throw new Error('Not authenticated');
      }

      const currentUserRes = await container.user.getUserByEmail(actualUserToken.email);
      if (currentUserRes.isFailure || !currentUserRes.getValue()) {
        throw new Error('Not authenticated');
      }
      const currentUser = currentUserRes.getValue()!;
      if (currentUser.disabled === true) {
        throw new Error('Account is disabled');
      }
      if (String(currentUser.role) !== UserRole.ADMIN) {
        throw new Error('Unauthorized: Admin role required');
      }

      const result = await container.user.getAllUsers();
      if (result.isFailure) {
        throw result.getError();
      }

      return result.getValue().map(mapToGql);
    },
  },
  Mutation: {
    setUser: async (
      _parent: unknown,
      { user, email, name, password, role }: SetUserInput,
      { container }: IContext,
    ) => {
      const result = await container.user.registerUser({
        user,
        email,
        name,
        password,
        role,
      });
      return !result.isFailure;
    },
    userAuthentication: async (
      _parent: unknown,
      { email, password }: UserAuthenticationInput,
      { container, token }: IContext,
    ) => {
      const result = await container.user.authenticateUser({ email, password });
      if (result.isFailure) {
        throw result.getError();
      }

      await token();
      return {
        token: result.getValue().token,
      };
    },
    updateUser: async (
      _parent: unknown,
      { id, name, user, email, role, disabled }: {
        id: string;
        name?: string;
        user?: string;
        email?: string;
        role?: string;
        disabled?: boolean;
      },
      { container, token }: IContext,
    ) => {
      const actualUserToken = (await token()) as DecodedToken | null;
      if (!actualUserToken) {
        throw new Error('Not authenticated');
      }

      const currentUserRes = await container.user.getUserByEmail(actualUserToken.email);
      if (currentUserRes.isFailure || !currentUserRes.getValue()) {
        throw new Error('Not authenticated');
      }
      const currentUser = currentUserRes.getValue()!;
      if (currentUser.disabled === true) {
        throw new Error('Account is disabled');
      }
      if (String(currentUser.role) !== UserRole.ADMIN) {
        throw new Error('Unauthorized: Admin role required');
      }

      const result = await container.user.updateUser(
        String(currentUser.id),
        id,
        { name, user, email, role, disabled }
      );

      if (result.isFailure) {
        throw result.getError();
      }

      return true;
    },
  },
};
