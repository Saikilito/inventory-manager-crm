import React from "react";
import { useApolloClient, ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { Navigate } from "react-router-dom";
import { usePlocState } from "@hooks/use-ploc-state";
import { UserRole } from "@shared-domain/shared/value-objects/role.vo";
import { useAuthPloc } from "@contexts/auth-context";
import { makeApolloClientRepository } from "@modules/client/infrastructure/repositories/apollo-client.repository";
import { makeGetClientsUseCase } from "@modules/client/application/use-cases/get-clients";
import { makeDeleteClientUseCase as makeDeleteClientUseCaseObj } from "@modules/client/application/use-cases/delete-client";
import { makeClientsPloc } from "@modules/client/presentation/ploc/clients-ploc";
import { ClientsPlocProvider } from "@contexts/clients-context";
import ClientList from "@pages/client/ClientList";
import OrdersPage from "@pages/order/OrdersPage";
import NewClient from "@pages/client/NewClient";

const useApollo = (): ApolloClient<NormalizedCacheObject> =>
  useApolloClient() as ApolloClient<NormalizedCacheObject>;

const useAuthSession = (): { _id: string; role: typeof UserRole.ADMIN | typeof UserRole.SELLER; name: string } | null => {
  const authPloc = useAuthPloc();
  const authState = usePlocState(authPloc);
  const user = authState.kind === "auth:authenticated" ? authState.user : null;
  if (!user) return null;
  return {
    _id: String(user.id),
    role: user.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.SELLER,
    name: String(user.name),
  };
};

export const ClientsRouteWrapper: React.FC = () => {
  const apolloClient = useApollo();
  const [ploc] = React.useState(() => {
    const repository = makeApolloClientRepository(apolloClient);
    const getClients = makeGetClientsUseCase(repository);
    const deleteClient = makeDeleteClientUseCaseObj(repository);
    return makeClientsPloc(getClients, deleteClient);
  });
  const sessionInfo = useAuthSession();
  if (!sessionInfo) return <Navigate to="/login" replace />;
  return (
    <ClientsPlocProvider ploc={ploc}>
      <ClientList session={sessionInfo} />
    </ClientsPlocProvider>
  );
};

export const OrdersPageGlobalWrapper: React.FC = () => {
  const apolloClient = useApollo();
  const [ploc] = React.useState(() => {
    const repository = makeApolloClientRepository(apolloClient);
    const getClients = makeGetClientsUseCase(repository);
    const deleteClient = makeDeleteClientUseCaseObj(repository);
    return makeClientsPloc(getClients, deleteClient);
  });
  const sessionInfo = useAuthSession();
  if (!sessionInfo) return <Navigate to="/login" replace />;
  return (
    <ClientsPlocProvider ploc={ploc}>
      <OrdersPage session={sessionInfo} />
    </ClientsPlocProvider>
  );
};

export const NewClientRouteWrapper: React.FC = () => {
  const sessionInfo = useAuthSession();
  if (!sessionInfo) return <Navigate to="/login" replace />;
  return <NewClient session={sessionInfo} />;
};
