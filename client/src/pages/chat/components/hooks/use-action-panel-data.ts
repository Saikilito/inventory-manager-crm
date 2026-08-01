import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { PRODUCTS_QUERY } from "@modules/product/infrastructure/graphql/queries";
import { CLIENTS_QUERY } from "@modules/client/infrastructure/graphql/queries";
import { GET_CHAT_SESSIONS } from "@modules/chat/infrastructure/graphql/queries";
import type {
  ActionPanelChatSession,
  ActionPanelClient,
  ActionPanelProduct,
} from "../../action-panel/action-panel.types";

const PRODUCTS_QUERY_LIMIT = 100;

interface ClientsQueryData {
  getAllClients: ActionPanelClient[];
}

interface ProductsQueryData {
  getAllProducts: ActionPanelProduct[];
}

interface ChatSessionsQueryData {
  getChatSessions: ActionPanelChatSession[];
}

export interface ActionPanelData {
  clients: ActionPanelClient[];
  products: ActionPanelProduct[];
  productsLoading: boolean;
  refetchClients: () => Promise<unknown>;
  currentSession: ActionPanelChatSession | undefined;
  crmClientMatch: ActionPanelClient | undefined;
}

export const useActionPanelData = (whatsappId: string): ActionPanelData => {
  const { data: clientsData, refetch: refetchClients } = useQuery<ClientsQueryData>(CLIENTS_QUERY);
  const { data: productsData, loading: productsLoading } = useQuery<ProductsQueryData>(PRODUCTS_QUERY, {
    variables: { limit: PRODUCTS_QUERY_LIMIT },
  });
  const { data: sessionsData } = useQuery<ChatSessionsQueryData>(GET_CHAT_SESSIONS);

  const clients = useMemo(() => clientsData?.getAllClients || [], [clientsData]);
  const products = useMemo(() => productsData?.getAllProducts || [], [productsData]);

  const currentSession = useMemo(
    () => sessionsData?.getChatSessions?.find((session) => session.whatsappId === whatsappId),
    [sessionsData, whatsappId]
  );

  const crmClientMatch = useMemo(
    () => clients.find((client) => client.whatsapp === whatsappId),
    [clients, whatsappId]
  );

  return useMemo(
    () => ({ clients, products, productsLoading, refetchClients, currentSession, crmClientMatch }),
    [clients, products, productsLoading, refetchClients, currentSession, crmClientMatch]
  );
};
