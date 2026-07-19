import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { getErrorMessage } from '../../../../../../shared-domain/src/shared/error-utils.js';
import { Id, IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateTime, DateTimeVO } from '../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js';
import { IRentalReservation } from '../../../../../../shared-domain/src/rental/rental.entity.js';
import { IRentalRepository } from '../repositories/rental.repository.js';
import { buildOverlapWhere } from '../services/build-overlap-where.js';

export interface GetOverlappingReservationsInput {
  productId: string;
  startDateTime: string;
  endDateTime: string;
}

export type GetOverlappingReservations = UseCase<GetOverlappingReservationsInput, IRentalReservation[], DomainError>;

export const makeGetOverlappingReservations = (rentalRepository: IRentalRepository): GetOverlappingReservations => {
  return async (input: GetOverlappingReservationsInput) => {
    let pId: Id;
    let startDT: DateTime;
    let endDT: DateTime;

    try {
      pId = IdVO.create(input.productId);
      startDT = DateTimeVO.create(input.startDateTime);
      endDT = DateTimeVO.create(input.endDateTime);
    } catch (err: unknown) {
      return Result.fail(err instanceof DomainError ? err : new ValidationError(getErrorMessage(err)));
    }

    const overlapResult = await rentalRepository.getAll({
      where: { fields: buildOverlapWhere(pId, startDT, endDT) }
    });
    if (overlapResult.isFailure) {
      return Result.fail(overlapResult.getError());
    }

    return Result.ok(overlapResult.getValue().items);
  };
};
