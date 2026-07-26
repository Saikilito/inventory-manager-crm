import { BaseRepository } from '../../../../../../shared-domain/src/shared/repository.js';
import { IAccountsPayable } from '../../../../../../shared-domain/src/financial/accounts-payable.entity.js';

export interface IAccountsPayableRepository extends BaseRepository<IAccountsPayable> {
  findByStatus(status: string, contextId?: string): Promise<IAccountsPayable[]>;
  findBySupplier(supplier: string, contextId?: string): Promise<IAccountsPayable[]>;
}
