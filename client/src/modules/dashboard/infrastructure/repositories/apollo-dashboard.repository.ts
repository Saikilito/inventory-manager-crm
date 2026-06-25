import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { DashboardRepository, ITopClient, ITopSeller } from '@modules/dashboard/domain/dashboard.repository';
import { doTryResult } from '@shared-domain/shared/do-try-result';
import { DatabaseError } from '@shared-domain/shared/errors';
import { TOP_CLIENTS, TOP_SELLERS } from '../graphql/queries';

interface GQLTopClient {
  total: number;
  client: Array<{
    firstName: string;
    lastName: string;
  }>;
}

interface GQLTopSeller {
  total: number;
  seller: Array<{
    name: string;
  }>;
}

interface GetTopClientsData {
  topClients: GQLTopClient[];
}

interface GetTopSellersData {
  topSellers: GQLTopSeller[];
}

export function makeApolloDashboardRepository(
  apolloClient: ApolloClient<NormalizedCacheObject>
): DashboardRepository {
  return {
    getTopClients: async () => {
      return doTryResult(
        async (): Promise<ITopClient[]> => {
          const { data } = await apolloClient.query<GetTopClientsData>({
            query: TOP_CLIENTS,
            fetchPolicy: 'no-cache',
          });

          return (data?.topClients || []).map((tc) => {
            // Server returns client as a list, grab first item
            const clientInfo = tc.client?.[0];
            const name = clientInfo 
              ? `${clientInfo.firstName} ${clientInfo.lastName}` 
              : 'Unknown Client';
            return {
              total: tc.total || 0,
              clientName: name,
            };
          });
        },
        (err) => new DatabaseError(err.message)
      );
    },

    getTopSellers: async () => {
      return doTryResult(
        async (): Promise<ITopSeller[]> => {
          const { data } = await apolloClient.query<GetTopSellersData>({
            query: TOP_SELLERS,
            fetchPolicy: 'no-cache',
          });

          return (data?.topSellers || []).map((ts) => {
            const sellerInfo = ts.seller?.[0];
            const name = sellerInfo ? sellerInfo.name : 'Unknown Seller';
            return {
              total: ts.total || 0,
              sellerName: name,
            };
          });
        },
        (err) => new DatabaseError(err.message)
      );
    },
  };
}
