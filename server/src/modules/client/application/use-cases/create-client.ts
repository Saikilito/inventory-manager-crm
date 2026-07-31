import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { makeClient, ClientRatingTier, type IClient } from '../../../../../../shared-domain/src/client/client.entity.js';
import { IClientRepository } from '../repositories/client.repository.js';

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  address: string;
  whatsapp: string;
  nationalId: string;
  orders?: string[];
  sellerId: string;
}

export type CreateClient = UseCase<CreateClientInput, IClient, DomainError>;

export const makeCreateClient = (clientRepository: IClientRepository): CreateClient => {
  return async (input: CreateClientInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('client', () => {
        return Result.ok(makeClient({
          firstName: input.firstName,
          lastName: input.lastName,
          address: input.address,
          whatsapp: input.whatsapp,
          nationalId: input.nationalId,
          type: ClientRatingTier.BASIC,
          orders: input.orders || [],
          sellerId: input.sellerId,
        }));
      })
      .useResult('save', ({ client }) => clientRepository.create(client, IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<IClient, DomainError>(composerResult.getValue().save as IClient);
  };
};
