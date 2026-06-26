import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IClient, makeClient } from '../../../../../../shared-domain/src/client/client.entity.js';
import { IClientRepository } from '../repositories/client.repository.js';

export interface UpdateClientInput {
  id: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  whatsapp?: string;
  age?: number;
  orders?: string[];
  sellerId?: string;
}

export type UpdateClient = UseCase<UpdateClientInput, void, DomainError>;

export const makeUpdateClient = (clientRepository: IClientRepository): UpdateClient => {
  return async (input: UpdateClientInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('existing', () => clientRepository.getById(IdVO.create(input.id)))
      .useResult('validateExisting', ({ existing }) => {
        const cli = existing as IClient | null;
        if (!cli) {
          return Result.fail(new NotFoundError('Client not found'));
        }
        return Result.ok(cli);
      })
      .useResult('updated', ({ validateExisting }) => {
        const existingCli = validateExisting as IClient;
        return Result.ok(makeClient({
          id: input.id,
          firstName: input.firstName !== undefined ? input.firstName : (existingCli.firstName as string),
          lastName: input.lastName !== undefined ? input.lastName : (existingCli.lastName as string),
          address: input.address !== undefined ? input.address : (existingCli.address as string),
          whatsapp: input.whatsapp !== undefined ? input.whatsapp : (existingCli.whatsapp as string),
          age: input.age !== undefined ? input.age : (existingCli.age as number),
          type: existingCli.type as string,
          orders: input.orders !== undefined ? input.orders : (existingCli.orders as string[]),
          sellerId: input.sellerId !== undefined ? input.sellerId : (existingCli.sellerId as string),
        }));
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { updated } = composerResult.getValue() as { updated: IClient };

    const saveResult = await clientRepository.updateById(IdVO.create(input.id), updated, IdVO.generateNil());
    if (saveResult.isFailure) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
