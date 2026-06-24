import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { AuthRepository } from '@modules/auth/domain/auth.repository';
import { IUser, makeUser } from '@shared-domain/user/user.entity';
import { doTryResult } from '@shared-domain/shared/do-try-result';
import { DatabaseError } from '@shared-domain/shared/errors';
import { CURRENT_USER } from '../graphql/queries';
import { CREATE_USER, AUTH_USER } from '../graphql/mutations';

interface GQLUser {
  _id: string;
  email: string;
  name: string;
  role: string;
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
    return makeUser({
      id: gqlUser._id,
      email: gqlUser.email,
      name: gqlUser.name,
      role: gqlUser.role,
    });
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
            throw new Error('No se pudo obtener el token de autenticación');
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
          const { data } = await apolloClient.mutate<{ setUser: string }>({
            mutation: CREATE_USER,
            variables: {
              email: String(user.email),
              name: String(user.name),
              password: String(user.password),
              role: String(user.role),
            },
          });

          return data?.setUser || 'User created successfully';
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
  };
}
