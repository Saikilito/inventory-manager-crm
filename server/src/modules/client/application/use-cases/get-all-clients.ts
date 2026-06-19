import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { WhereField } from '../../../../../../shared-domain/src/shared/repository.js';
import { IClient } from '../../../../../../shared-domain/src/client/client.entity.js';
import { IClientRepository } from '../repositories/client.repository.js';

export interface GetAllClientsInput {
  limit?: number;
  offset?: number;
  sellerId?: string;
}

export type GetAllClients = UseCase<GetAllClientsInput, IClient[], DomainError>;

export const makeGetAllClients = (clientRepository: IClientRepository): GetAllClients => {
  return async (input: GetAllClientsInput) => {
    const limitNum = input.limit ?? 10;
    const offsetNum = input.offset ?? 0;
    const pageNum = Math.floor(offsetNum / limitNum) + 1;

    const composerResult = await ResultComposer.start()
      .useResult('clientsResult', () => {
        const fields: WhereField[] = [];
        if (input.sellerId) {
          fields.push({
            field: NonEmptyStringVO.create('sellerId'),
            value: input.sellerId,
            operator: '=',
          });
        }

        return clientRepository.getAll({
          limit: PositiveNumberVO.create(limitNum),
          page: PositiveNumberVO.create(pageNum),
          where: { fields },
        });
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok(composerResult.getValue().clientsResult.items);
  };
};
