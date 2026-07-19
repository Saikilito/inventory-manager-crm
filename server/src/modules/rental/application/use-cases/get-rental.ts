import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IRentalReservation } from '../../../../../../shared-domain/src/rental/rental.entity.js';
import { IRentalRepository } from '../repositories/rental.repository.js';

export type GetRental = UseCase<string, IRentalReservation, DomainError>;

export const makeGetRental = (rentalRepository: IRentalRepository): GetRental => {
  return async (id: string) => {
    const idResult = IdVO.createResult(id);
    if (idResult.isFailure) {
      return Result.fail(idResult.getError());
    }

    const rentalResult = await rentalRepository.getById(idResult.getValue());
    if (rentalResult.isFailure) {
      return Result.fail(rentalResult.getError());
    }

    const rental = rentalResult.getValue();
    if (!rental) {
      return Result.fail(new NotFoundError(`Rental reservation with ID ${id} not found`));
    }

    return Result.ok(rental);
  };
};
