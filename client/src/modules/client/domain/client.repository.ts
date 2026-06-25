import { Result } from '@shared-domain/shared/result.js';
import { IClient } from '@shared-domain/client/client.entity.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { Id } from '@shared-domain/shared/value-objects/id.vo.js';
import { PositiveNumber } from '@shared-domain/shared/value-objects/positive-number.vo.js';
import { NonNegativeNumber } from '@shared-domain/shared/value-objects/non-negative-number.vo.js';

export interface GetAllClientsResult {
  clients: IClient[];
  totalClients: number;
}

export interface ClientRepository {
  getAll(limit?: PositiveNumber, offset?: NonNegativeNumber, sellerId?: Id): Promise<Result<GetAllClientsResult, DomainError>>;
  getById(id: Id): Promise<Result<IClient | null, DomainError>>;
  create(client: IClient): Promise<Result<boolean, DomainError>>;
  update(client: IClient): Promise<Result<boolean, DomainError>>;
  delete(id: Id): Promise<Result<boolean, DomainError>>;
}
