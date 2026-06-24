import { OrderRepository } from '../../domain/order.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IOrder } from '@shared-domain/order/order.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface CreateOrderUseCase {
  execute(order: IOrder): Promise<Result<boolean, DomainError>>;
}

export function makeCreateOrderUseCase(repository: OrderRepository): CreateOrderUseCase {
  return {
    execute: (order) => repository.create(order),
  };
}
