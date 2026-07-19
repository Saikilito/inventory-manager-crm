import { BaseRepository } from '../../../../../../shared-domain/src/shared/repository.js';
import { IRentalReservation } from '../../../../../../shared-domain/src/rental/rental.entity.js';

export interface IRentalRepository extends BaseRepository<IRentalReservation> {}
