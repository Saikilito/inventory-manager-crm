import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { AuthRepository } from '@modules/auth/domain/auth.repository';
import { IUser, makeUser } from '@shared-domain/user/user.entity';
import { doTryResult } from '@shared-domain/shared/do-try-result';
import { DatabaseError } from '@shared-domain/shared/errors';
import { CURRENT_USER, GET_USERS } from '../graphql/queries';
import { CREATE_USER, AUTH_USER, UPDATE_USER } from '../graphql/mutations';

interface GQLUser {
  _id: string;
  user: string;
  email: string;
  name: string;
  role: string;
  disabled?: boolean;
}

interface GetUserData {
  getUser: GQLUser;
}

interface AuthUserData {
  userAuthentication: {
    token: string;
  };
}

export function makeApolloAuthRepository(
  apolloClient: ApolloClient<NormalizedCacheObject>
): AuthRepository {
  
  const mapGQLToDomain = (gqlUser: GQLUser): IUser => {
    const result = makeUser({
      id: gqlUser._id,
      user: gqlUser.user,
      email: gqlUser.email,
      name: gqlUser.name,
      role: gqlUser.role,
      disabled: gqlUser.disabled,
    });
    if (result.isFailure) {
      throw result.getError();
    }
    return result.getValue();
  };

  return {
    getCurrentUser: async () => {
      return doTryResult(
        async (): Promise<IUser | null> => {
          const token = localStorage.getItem('Token');
          if (!token) {
            return null;
          }

          const { data } = await apolloClient.query<GetUserData>({
            query: CURRENT_USER,
            fetchPolicy: 'network-only', // Ensure fresh token-checked session
          });

          if (!data || !data.getUser) {
            return null;
          }

          return mapGQLToDomain(data.getUser);
        },
        (err) => new DatabaseError(err.message)
      );
    },

    login: async (email, password) => {
      return doTryResult(
        async (): Promise<string> => {
          const { data } = await apolloClient.mutate<AuthUserData>({
            mutation: AUTH_USER,
            variables: {
              email,
              password,
            },
          });

          const token = data?.userAuthentication?.token;
          if (!token) {
            throw new Error('Could not obtain authentication token');
          }

          // Save token in localStorage
          localStorage.setItem('Token', token);
          return token;
        },
        (err) => new DatabaseError(err.message)
      );
    },

    register: async (user) => {
      return doTryResult(
        async (): Promise<string> => {
          const { data } = await apolloClient.mutate<{ setUser: boolean }>({
            mutation: CREATE_USER,
            variables: {
              user: String(user.user),
              email: String(user.email),
              name: String(user.name),
              password: String(user.password),
              role: String(user.role),
            },
          });

          if (data?.setUser === false) {
            throw new Error('Error registering user in database');
          }

          return 'User created successfully';
        },
        (err) => new DatabaseError(err.message)
      );
    },

    logout: async () => {
      return doTryResult(
        async (): Promise<void> => {
          localStorage.removeItem('Token');
          // Clear Apollo cache store
          await apolloClient.clearStore();
        },
        (err) => new DatabaseError(err.message)
      );
    },

    getUsers: async () => {
      return doTryResult(
        async (): Promise<IUser[]> => {
          const { data } = await apolloClient.query<{ getUsers: GQLUser[] }>({
            query: GET_USERS,
            fetchPolicy: 'network-only',
          });

          if (!data || !data.getUsers) {
            return [];
          }

          return data.getUsers.map(mapGQLToDomain);
        },
        (err) => new DatabaseError(err.message)
      );
    },

    updateUser: async (id, partialUser) => {
      return doTryResult(
        async (): Promise<void> => {
          const { data } = await apolloClient.mutate<{ updateUser: boolean }>({
            mutation: UPDATE_USER,
            variables: {
              id,
              user: partialUser.user ? String(partialUser.user) : undefined,
              email: partialUser.email ? String(partialUser.email) : undefined,
              name: partialUser.name ? String(partialUser.name) : undefined,
              role: partialUser.role ? String(partialUser.role) : undefined,
              disabled: partialUser.disabled !== undefined ? partialUser.disabled : undefined,
            },
          });

          if (data?.updateUser === false) {
            throw new Error('Error updating user in database');
          }
        },
        (err) => new DatabaseError(err.message)
      );
    },
  };
}
