import { makeGetByIdUseCase } from '../../../../../../shared-domain/src/shared/make-get-by-id.js';
import { IContext } from '../../../../../../shared-domain/src/context/context.entity.js';
import { IContextRepository } from '../repositories/context.repository.js';

export type GetContext = ReturnType<typeof makeGetContext>;

export const makeGetContext = (contextRepository: IContextRepository) =>
  makeGetByIdUseCase<IContext>('Context', (id) => contextRepository.getById(id));
