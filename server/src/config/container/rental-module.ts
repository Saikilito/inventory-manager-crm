import { makeRentalMongooseRepository } from '../../modules/rental/infrastructure/repositories/rental-mongoose.repository.js';
import { GetRental, makeGetRental } from '../../modules/rental/application/use-cases/get-rental.js';
import { CreateRentalReservation, makeCreateRentalReservation } from '../../modules/rental/application/use-cases/create-rental-reservation.js';
import { ReturnRental, makeReturnRental } from '../../modules/rental/application/use-cases/return-rental.js';
import { GetOverlappingReservations, makeGetOverlappingReservations } from '../../modules/rental/application/use-cases/get-overlapping-reservations.js';
import { IRentalRepository } from '../../modules/rental/application/repositories/rental.repository.js';
import { IProductRepository } from '../../modules/product/application/repositories/product.repository.js';

export interface RentalSubContainer {
  getRental: GetRental;
  createRentalReservation: CreateRentalReservation;
  returnRentalEquipment: ReturnRental;
  getOverlappingReservations: GetOverlappingReservations;
  rentalRepository: IRentalRepository;
}

export const buildRentalModule = (deps: {
  rentalRepository?: IRentalRepository;
  productRepository: IProductRepository;
}): RentalSubContainer => {
  const rentalRepository = deps.rentalRepository ?? makeRentalMongooseRepository();
  return {
    getRental: makeGetRental(rentalRepository),
    createRentalReservation: makeCreateRentalReservation(rentalRepository, deps.productRepository),
    returnRentalEquipment: makeReturnRental(rentalRepository),
    getOverlappingReservations: makeGetOverlappingReservations(rentalRepository),
    rentalRepository,
  };
};
