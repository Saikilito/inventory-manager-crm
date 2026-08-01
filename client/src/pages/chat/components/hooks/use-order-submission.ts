import { useCallback, useMemo } from "react";
import { useApolloClient, ApolloClient, NormalizedCacheObject } from "@apollo/client";

import { makeApolloClientRepository } from "@modules/client/infrastructure/repositories/apollo-client.repository";
import { makeCreateClientUseCase } from "@modules/client/application/use-cases/create-client";
import { makeGetClientsUseCase } from "@modules/client/application/use-cases/get-clients";
import { makeClient, ClientRatingTier } from "@shared-domain/client/client.entity";

import { makeApolloOrderRepository } from "@modules/order/infrastructure/repositories/apollo-order.repository";
import { makeCreateOrderUseCase } from "@modules/order/application/use-cases/create-order";
import { makeOrder, OrderStatus } from "@shared-domain/order/order.entity";

import { Result } from "@shared-domain/shared/result";
import { DomainError, createNotFoundError } from "@shared-domain/shared/errors";

export interface NewClientInput {
  firstName: string;
  lastName: string;
  address: string;
  whatsapp: string;
  nationalId: string;
  sellerId: string;
}

export interface SubmitOrderItem {
  productId: string;
  quantity: number;
  sellingPriceAtSale: number;
  purchasePriceAtSale: number;
}

export interface SubmitOrderInput {
  clientId: string;
  items: SubmitOrderItem[];
  total: number;
  sellerId: string;
  deliveryCost?: number;
  customDeliveryAddress?: string;
}

export interface OrderSubmission {
  findOrCreateClient: (whatsappId: string, newClient: NewClientInput) => Promise<Result<string, DomainError>>;
  submitOrder: (input: SubmitOrderInput) => Promise<Result<boolean, DomainError>>;
}

export const useOrderSubmission = (): OrderSubmission => {
  const apolloClient = useApolloClient() as ApolloClient<NormalizedCacheObject>;

  const findOrCreateClient = useCallback(
    async (whatsappId: string, newClient: NewClientInput): Promise<Result<string, DomainError>> => {
      const clientRepo = makeApolloClientRepository(apolloClient);
      const getClients = makeGetClientsUseCase(clientRepo);

      const existingResult = await getClients.execute();
      if (existingResult.isFailure) {
        return Result.fail(existingResult.getError());
      }

      const matched = existingResult.getValue().clients.find((c) => String(c.whatsapp) === whatsappId);
      if (matched?.id) {
        return Result.ok(String(matched.id));
      }

      const createClientUseCase = makeCreateClientUseCase(clientRepo);
      const clientEntity = makeClient({ ...newClient, type: ClientRatingTier.BASIC, orders: [] });
      const createResult = await createClientUseCase.execute(clientEntity);
      if (createResult.isFailure) {
        return Result.fail(createResult.getError());
      }

      const refreshedResult = await getClients.execute();
      if (refreshedResult.isFailure) {
        return Result.fail(refreshedResult.getError());
      }

      const created = refreshedResult.getValue().clients.find((c) => String(c.whatsapp) === whatsappId);
      if (!created?.id) {
        return Result.fail(createNotFoundError("Client registered but could not retrieve CRM ID."));
      }

      return Result.ok(String(created.id));
    },
    [apolloClient]
  );

  const submitOrder = useCallback(
    async (input: SubmitOrderInput): Promise<Result<boolean, DomainError>> => {
      const orderRepo = makeApolloOrderRepository(apolloClient);
      const createOrderUseCase = makeCreateOrderUseCase(orderRepo);

      const orderEntity = makeOrder({
        clientId: input.clientId,
        items: input.items,
        total: input.total,
        sellerId: input.sellerId,
        status: OrderStatus.ACTIVE,
        deliveryCost: input.deliveryCost,
        customDeliveryAddress: input.customDeliveryAddress,
      });

      return createOrderUseCase.execute(orderEntity);
    },
    [apolloClient]
  );

  return useMemo(() => ({ findOrCreateClient, submitOrder }), [findOrCreateClient, submitOrder]);
};
