import { BaseRepository } from '../../../../../../shared-domain/src/shared/repository.js';
import { IOrder } from '../../../../../../shared-domain/src/order/order.entity.js';

export interface IOrderRepository extends BaseRepository<IOrder> {}
