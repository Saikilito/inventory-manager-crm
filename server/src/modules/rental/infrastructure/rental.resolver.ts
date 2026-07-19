import { IContext as IContextApollo } from '../../../config/apollo.js';
import { IRentalReservation } from '../../../../../shared-domain/src/rental/rental.entity.js';

const mapToGql = (rental: IRentalReservation) => {
  return {
    _id: rental.id,
    productId: rental.productId,
    orderId: rental.orderId,
    startDateTime: rental.startDateTime,
    endDateTime: rental.endDateTime,
    quantity: rental.quantity,
    status: rental.status,
  };
};

export default {
  Query: {
    getAllRentals: async (_parent: unknown, _args: unknown, { container }: IContextApollo) => {
      const result = await container.rental.rentalRepository.getAll();
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().items.map(mapToGql);
    },

    getRental: async (_parent: unknown, { id }: { id: string }, { container }: IContextApollo) => {
      const result = await container.rental.getRental(id);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    getOverlappingReservations: async (
      _parent: unknown,
      { productId, startDateTime, endDateTime }: { productId: string; startDateTime: string; endDateTime: string },
      { container }: IContextApollo
    ) => {
      const result = await container.rental.getOverlappingReservations({ productId, startDateTime, endDateTime });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().map(mapToGql);
    },
  },

  Mutation: {
    createRentalReservation: async (
      _parent: unknown,
      { input }: { input: { productId: string; orderId: string; startDateTime: string; durationHours: number; quantity: number } },
      { container }: IContextApollo
    ) => {
      const result = await container.rental.createRentalReservation(input);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    returnRentalEquipment: async (
      _parent: unknown,
      { rentalId }: { rentalId: string },
      { container }: IContextApollo
    ) => {
      const result = await container.rental.returnRentalEquipment({ rentalId });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },
  },
};
