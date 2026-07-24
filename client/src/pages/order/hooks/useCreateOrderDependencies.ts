import { useState, useCallback, useEffect } from 'react';
import { useApolloClient, useQuery, ApolloClient, NormalizedCacheObject } from '@apollo/client';

import { makeApolloClientRepository } from '@modules/client/infrastructure/repositories/apollo-client.repository';
import { makeGetClientUseCase } from '@modules/client/application/use-cases/get-client';
import { makeGetClientsUseCase } from '@modules/client/application/use-cases/get-clients';
import { makeCreateClientUseCase } from '@modules/client/application/use-cases/create-client';
import { makeClient, ClientRatingTier } from '@shared-domain/client/client.entity';

import { makeApolloProductRepository } from '@modules/product/infrastructure/repositories/apollo-product.repository';
import { makeGetProductsUseCase } from '@modules/product/application/use-cases/get-products';
import { GET_ALL_CONTEXTS } from '@modules/product/infrastructure/graphql/queries';

import { IClient } from '@shared-domain/client/client.entity';
import { IProduct } from '@shared-domain/product/product.entity';
import { IdVO } from '@shared-domain/shared/value-objects/id.vo';
import { PositiveNumberVO } from '@shared-domain/shared/value-objects/positive-number.vo';
import { NonNegativeNumberVO } from '@shared-domain/shared/value-objects/non-negative-number.vo';

export function useCreateOrderDependencies(clientIdFromParams?: string) {
  const apolloClient = useApolloClient();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<IClient | null>(null);
  const [clients, setClients] = useState<IClient[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: contextsData } = useQuery(GET_ALL_CONTEXTS, { fetchPolicy: 'cache-first' });
  const contexts = contextsData?.getAllContexts || [];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const clientRepo = makeApolloClientRepository(apolloClient as ApolloClient<NormalizedCacheObject>);

      const getClients = makeGetClientsUseCase(clientRepo);
      const clientsResult = await getClients.execute();
      if (!clientsResult.isFailure) {
        setClients(clientsResult.getValue().clients);
      }

      if (clientIdFromParams) {
        const idVO = IdVO.create(clientIdFromParams);
        const getClient = makeGetClientUseCase(clientRepo);
        const clientResult = await getClient.execute(idVO);

        if (!clientResult.isFailure) {
          setClient(clientResult.getValue());
        }
      }

      const productRepo = makeApolloProductRepository(apolloClient as ApolloClient<NormalizedCacheObject>);
      const getProducts = makeGetProductsUseCase(productRepo);
      const productsResult = await getProducts.execute(PositiveNumberVO.create(100), NonNegativeNumberVO.create(0));

      if (!productsResult.isFailure) {
        setProducts(productsResult.getValue().products);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error initializing page');
    } finally {
      setLoading(false);
    }
  }, [clientIdFromParams, apolloClient]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshClients = async () => {
    try {
      const clientRepo = makeApolloClientRepository(apolloClient as ApolloClient<NormalizedCacheObject>);
      const getClients = makeGetClientsUseCase(clientRepo);
      const clientsResult = await getClients.execute();
      if (!clientsResult.isFailure) {
        const newClients = clientsResult.getValue().clients;
        setClients(newClients);
        return newClients;
      }
    } catch (e) {
      console.error('Failed to refresh clients', e);
    }
    return null;
  };

  const createClient = async (data: {
    firstName: string;
    lastName: string;
    address: string;
    whatsapp: string;
    nationalId: string;
    sellerId: string;
  }) => {
    const repository = makeApolloClientRepository(apolloClient as ApolloClient<NormalizedCacheObject>);
    const createClientUseCase = makeCreateClientUseCase(repository);

    const clientEntity = makeClient({
      ...data,
      type: ClientRatingTier.BASIC,
      orders: [],
    });

    const result = await createClientUseCase.execute(clientEntity);
    return result;
  };

  return {
    loading,
    error,
    client,
    setClient,
    clients,
    products,
    contexts,
    refreshClients,
    createClient,
  };
}
