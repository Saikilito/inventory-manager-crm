import { IContext } from '../../../config/apollo.js';
import { IUser } from '../../../../../shared-domain/src/user/user.entity.js';

interface SetUserInput {
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
    email: user.email,
    name: user.name,
    role: user.role,
  };
};

export default {
  Query: {
    getUser: async (_parent: unknown, _args: unknown, { container, token }: IContext) => {
      const actualUser = (await token()) as any;
      if (!actualUser) {
        return null;
      }

      const result = await container.user.getUserByEmail(actualUser.email);
      if (result.isFailure) {
        return null;
      }

      const user = result.getValue();
      return user ? mapToGql(user) : null;
    },
  },
  Mutation: {
    setUser: async (
      _parent: unknown,
      { email, name, password, role }: SetUserInput,
      { container }: IContext,
    ) => {
      const result = await container.user.registerUser({
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
  },
};
