import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import {
  ClientRepository,
  GetAllClientsResult,
} from "@modules/client/domain/client.repository";
import {
  IClient,
  makeClient,
  ClientRatingTier,
} from "@shared-domain/client/client.entity";
import { doTryResult } from "@shared-domain/shared/do-try-result";
import { DatabaseError } from "@shared-domain/shared/errors";
import { CLIENTS_QUERY, SINGLE_CLIENT_QUERY } from "../graphql/queries";
import {
  CREATE_CLIENT,
  UPDATE_CLIENT,
  DELETE_CLIENT,
} from "../graphql/mutations";

const LegacyClientType = {
  BASIC: "BASICO",
  PREMIUM: "PREMIUM",
} as const;

interface GQLClient {
  _id: string;
  firstName: string;
  lastName: string;
  address: string;
  whatsapp: string;
  age: number;
  type: string;
  sellerId: string;
}

interface GetAllClientsData {
  getAllClients: GQLClient[];
  totalClients: number;
}

interface GetClientData {
  getClient: GQLClient;
}

export function makeApolloClientRepository(
  apolloClient: ApolloClient<NormalizedCacheObject>,
): ClientRepository {
  const mapGQLToDomain = (gqlClient: GQLClient): IClient => {
    let typeCoerced = gqlClient.type;
    if (typeCoerced === LegacyClientType.BASIC) {
      typeCoerced = ClientRatingTier.BASIC;
    }

    return makeClient({
      id: gqlClient._id,
      firstName: gqlClient.firstName,
      lastName: gqlClient.lastName,
      address: gqlClient.address,
      whatsapp: gqlClient.whatsapp,
      age: gqlClient.age,
      type: typeCoerced,
      orders: [],
      sellerId: gqlClient.sellerId,
    });
  };

  return {
    getAll: async (limit, offset, sellerId) => {
      return doTryResult(
        async (): Promise<GetAllClientsResult> => {
          const { data } = await apolloClient.query<GetAllClientsData>({
            query: CLIENTS_QUERY,
            variables: {
              limit: limit,
              offset: offset,
              sellerId: sellerId,
            },
            fetchPolicy: "no-cache",
          });

          return {
            clients: (data.getAllClients || []).map(mapGQLToDomain),
            totalClients: data.totalClients || 0,
          };
        },
        (err) => new DatabaseError(err.message),
      );
    },

    getById: async (id) => {
      return doTryResult(
        async (): Promise<IClient | null> => {
          const { data } = await apolloClient.query<GetClientData>({
            query: SINGLE_CLIENT_QUERY,
            variables: { id: id },
            fetchPolicy: "no-cache",
          });

          if (!data || !data.getClient) {
            return null;
          }

          return mapGQLToDomain(data.getClient);
        },
        (err) => new DatabaseError(err.message),
      );
    },

    create: async (client) => {
      return doTryResult(
        async (): Promise<boolean> => {
          const { data } = await apolloClient.mutate<{ setClient: boolean }>({
            mutation: CREATE_CLIENT,
            variables: {
              input: {
                firstName: String(client.firstName),
                lastName: String(client.lastName),
                address: String(client.address),
                whatsapp: String(client.whatsapp),
                age: Number(client.age),
                sellerId: String(client.sellerId),
              },
            },
          });

          return data?.setClient ?? true;
        },
        (err) => new DatabaseError(err.message),
      );
    },

    update: async (client) => {
      return doTryResult(
        async (): Promise<boolean> => {
          const { data } = await apolloClient.mutate<{ updateClient: boolean }>(
            {
              mutation: UPDATE_CLIENT,
              variables: {
                input: {
                  _id: String(client.id),
                  firstName: String(client.firstName),
                  lastName: String(client.lastName),
                  address: String(client.address),
                  whatsapp: String(client.whatsapp),
                  age: Number(client.age),
                  sellerId: String(client.sellerId),
                },
              },
            },
          );

          return data?.updateClient ?? true;
        },
        (err) => new DatabaseError(err.message),
      );
    },

    delete: async (id) => {
      return doTryResult(
        async (): Promise<boolean> => {
          const { data } = await apolloClient.mutate<{ deleteClient: boolean }>(
            {
              mutation: DELETE_CLIENT,
              variables: { _id: String(id) },
            },
          );

          return data?.deleteClient ?? true;
        },
        (err) => new DatabaseError(err.message),
      );
    },
  };
}
