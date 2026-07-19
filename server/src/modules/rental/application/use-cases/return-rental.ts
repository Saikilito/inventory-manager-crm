import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { getErrorMessage } from '../../../../../../shared-domain/src/shared/error-utils.js';
import { IRentalReservation, RentalStatus } from '../../../../../../shared-domain/src/rental/rental.entity.js';
import { IRentalRepository } from '../repositories/rental.repository.js';
import { Id, IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';

export interface ReturnRentalInput {
  rentalId: string;
}

export type ReturnRental = UseCase<ReturnRentalInput, IRentalReservation, DomainError>;

export const makeReturnRental = (rentalRepository: IRentalRepository): ReturnRental => {
  return async (input: ReturnRentalInput): Promise<Result<IRentalReservation, DomainError>> => {
    let rId: Id;
    try {
      rId = IdVO.create(input.rentalId);
    } catch (err: unknown) {
      return Result.fail(new ValidationError(getErrorMessage(err)));
    }

    const composerResult = await ResultComposer.start()
      .useResult('rental', () => rentalRepository.getById(rId))
      .useResult('validation', ({ rental }) => {
        if (!rental) {
          return Result.fail(new ValidationError(`Rental reservation with ID ${input.rentalId} not found`));
        }
        if (rental.status === RentalStatus.RETURNED) {
          return Result.fail(new ValidationError(`Rental reservation with ID ${input.rentalId} has already been returned`));
        }
        if (rental.status === RentalStatus.CANCELLED) {
          return Result.fail(new ValidationError(`Rental reservation with ID ${input.rentalId} is cancelled and cannot be returned`));
        }
        return Result.ok(void 0);
      })
      .useResult('update', () => {
        return rentalRepository.updateById(rId, { status: RentalStatus.RETURNED }, IdVO.generateNil());
      })
      .useResult('updatedRental', async () => {
        const fetchResult = await rentalRepository.getById(rId);
        if (fetchResult.isFailure) {
          return Result.fail(fetchResult.getError());
        }
        const updated = fetchResult.getValue();
        if (!updated) {
          return Result.fail(new ValidationError(`Rental reservation not found after update`));
        }
        return Result.ok(updated);
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok(composerResult.getValue().updatedRental as IRentalReservation);
  };
};
