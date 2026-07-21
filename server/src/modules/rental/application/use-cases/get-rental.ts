import { makeGetByIdUseCase } from '../../../../../../shared-domain/src/shared/make-get-by-id.js';
import { IRentalReservation } from '../../../../../../shared-domain/src/rental/rental.entity.js';
import { IRentalRepository } from '../repositories/rental.repository.js';

export type GetRental = ReturnType<typeof makeGetRental>;

export const makeGetRental = (rentalRepository: IRentalRepository) =>
  makeGetByIdUseCase<IRentalReservation>('Rental reservation', (id) => rentalRepository.getById(id));
