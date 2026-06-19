import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IDashboardRepository, ITopClient } from '../repositories/dashboard.repository.js';

export type GetTopClients = UseCase<void, ITopClient[], DomainError>;

export const makeGetTopClients = (dashboardRepository: IDashboardRepository): GetTopClients => {
  return async () => {
    const composerResult = await ResultComposer.start()
      .useResult('topClients', dashboardRepository.getTopClients())
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok(composerResult.getValue().topClients);
  };
};
