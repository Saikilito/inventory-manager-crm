import { OrderRepository } from '../../domain/order.repository.js';
import { Result } from '@shared-domain/shared/result.js';
import { IOrder } from '@shared-domain/order/order.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';

export interface UpdateOrderUseCase {
  execute(order: IOrder): Promise<Result<boolean, DomainError>>;
}

export function makeUpdateOrderUseCase(repository: OrderRepository): UpdateOrderUseCase {
  return {
    execute: (order) => repository.update(order),
  };
}
