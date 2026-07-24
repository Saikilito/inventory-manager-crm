import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { createNotFoundError, DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
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
  nationalId?: string;
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
          return Result.fail(createNotFoundError('Client not found'));
        }
        return Result.ok(cli);
      })
      .useResult('updated', ({ validateExisting }) => {
        const existingCli = validateExisting as IClient;
        return Result.ok(
          makeClient({
            id: input.id,
            firstName: input.firstName !== undefined ? input.firstName : existingCli.firstName,
            lastName: input.lastName !== undefined ? input.lastName : existingCli.lastName,
            address: input.address !== undefined ? input.address : existingCli.address,
            whatsapp: input.whatsapp !== undefined ? input.whatsapp : existingCli.whatsapp,
            nationalId: input.nationalId !== undefined ? input.nationalId : existingCli.nationalId,
            type: existingCli.type,
            orders: input.orders !== undefined ? input.orders : (existingCli.orders as unknown as string[]),
            sellerId: input.sellerId !== undefined ? input.sellerId : existingCli.sellerId,
          }),
        );
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
