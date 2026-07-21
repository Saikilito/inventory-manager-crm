import { makeGetByIdUseCase } from '../../../../../../shared-domain/src/shared/make-get-by-id.js';
import { IClient } from '../../../../../../shared-domain/src/client/client.entity.js';
import { IClientRepository } from '../repositories/client.repository.js';

export type GetClient = ReturnType<typeof makeGetClient>;

export const makeGetClient = (clientRepository: IClientRepository) =>
  makeGetByIdUseCase<IClient>('Client', (id) => clientRepository.getById(id));
