import { Result } from '@shared-domain/shared/result.js';
import { IOrder } from '@shared-domain/order/order.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';

export interface OrderRepository {
  getClientOrders(clientId: Id): Promise<Result<IOrder[], DomainError>>;
  create(order: IOrder): Promise<Result<boolean, DomainError>>;
  update(order: IOrder): Promise<Result<boolean, DomainError>>;
}
