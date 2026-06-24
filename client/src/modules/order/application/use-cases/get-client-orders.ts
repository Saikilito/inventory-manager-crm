import { OrderRepository } from '../../domain/order.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IOrder } from '@shared-domain/order/order.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';

export interface GetClientOrdersUseCase {
  execute(clientId: Id): Promise<Result<IOrder[], DomainError>>;
}

export function makeGetClientOrdersUseCase(repository: OrderRepository): GetClientOrdersUseCase {
  return {
    execute: (clientId) => repository.getClientOrders(clientId),
  };
}
