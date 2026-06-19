import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { makeClient } from '../../../../../../shared-domain/src/client/client.entity.js';
import { IClientRepository } from '../repositories/client.repository.js';

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  company: string;
  emails: string[];
  age?: number;
  type: string;
  orders?: string[];
  sellerId: string;
}

export type CreateClient = UseCase<CreateClientInput, void, DomainError>;

export const makeCreateClient = (clientRepository: IClientRepository): CreateClient => {
  return async (input: CreateClientInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('client', () => {
        return Result.ok(makeClient({
          ...input,
          orders: input.orders || [],
        }));
      })
      .useResult('save', ({ client }) => clientRepository.create(client, IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
