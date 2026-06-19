import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { WhereField } from '../../../../../../shared-domain/src/shared/repository.js';
import { IClientRepository } from '../repositories/client.repository.js';

export interface TotalClientsInput {
  sellerId?: string;
}

export type TotalClients = UseCase<TotalClientsInput, number, DomainError>;

export const makeTotalClients = (clientRepository: IClientRepository): TotalClients => {
  return async (input: TotalClientsInput) => {
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
          limit: PositiveNumberVO.create(1),
          where: { fields },
        });
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok(composerResult.getValue().clientsResult.total);
  };
};
