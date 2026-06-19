import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IDashboardRepository, ITopSeller } from '../repositories/dashboard.repository.js';

export type GetTopSellers = UseCase<void, ITopSeller[], DomainError>;

export const makeGetTopSellers = (dashboardRepository: IDashboardRepository): GetTopSellers => {
  return async () => {
    const composerResult = await ResultComposer.start()
      .useResult('topSellers', dashboardRepository.getTopSellers())
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok(composerResult.getValue().topSellers);
  };
};
