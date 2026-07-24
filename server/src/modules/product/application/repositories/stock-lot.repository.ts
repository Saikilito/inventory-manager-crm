import { BaseRepository } from '../../../../../../shared-domain/src/shared/repository.js';
import { IStockLot } from '../../../../../../shared-domain/src/stock-lot/stock-lot.entity.js';

export interface IStockLotRepository extends BaseRepository<IStockLot> {
  findBySupplierName(supplier: string, contextId?: string): Promise<IStockLot[]>;
  findByStatus(status: string, contextId?: string): Promise<IStockLot[]>;
}
