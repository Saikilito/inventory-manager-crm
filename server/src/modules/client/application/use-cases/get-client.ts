import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IClient } from '../../../../../../shared-domain/src/client/client.entity.js';
import { IClientRepository } from '../repositories/client.repository.js';

export type GetClient = UseCase<string, IClient, DomainError>;

export const makeGetClient = (clientRepository: IClientRepository): GetClient => {
  return async (id: string) => {
    const composerResult = await ResultComposer.start()
      .useResult('client', () => clientRepository.getById(IdVO.create(id)))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const client = composerResult.getValue().client;
    if (!client) {
      return Result.fail(new NotFoundError('Client not found'));
    }

    return Result.ok(client);
  };
};
