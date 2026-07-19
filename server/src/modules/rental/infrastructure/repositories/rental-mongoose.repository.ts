import { IRentalReservation, makeRentalReservation } from '../../../../../../shared-domain/src/rental/rental.entity.js';
import { IRentalReservationDocument, RentalModel } from '../rental.model.js';
import { IRentalRepository } from '../../application/repositories/rental.repository.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';
import { WhereField } from '../../../../../../shared-domain/src/shared/repository.js';

const mapToDomain = (doc: IRentalReservationDocument): IRentalReservation => {
  const result = makeRentalReservation({
    id: doc._id.toString(),
    productId: doc.productId.toString(),
    orderId: doc.orderId.toString(),
    startDateTime: doc.startDateTime,
    endDateTime: doc.endDateTime,
    quantity: doc.quantity,
    status: doc.status,
  });
  if (result.isFailure) {
    throw result.getError();
  }
  return result.getValue();
};

export const makeRentalMongooseRepository = (): IRentalRepository => {
  const base = makeMongooseBaseRepository<IRentalReservation, IRentalReservationDocument>({
    model: RentalModel,
    mapToDomain,
    mapToDocumentData: (rental) => {
      const data: Partial<IRentalReservationDocument> = {};
      if (rental.productId !== undefined) data.productId = rental.productId;
      if (rental.orderId !== undefined) data.orderId = rental.orderId;
      if (rental.startDateTime !== undefined) {
        data.startDateTime = rental.startDateTime ? new Date(rental.startDateTime) : undefined;
      }
      if (rental.endDateTime !== undefined) {
        data.endDateTime = rental.endDateTime ? new Date(rental.endDateTime) : undefined;
      }
      if (rental.quantity !== undefined) data.quantity = rental.quantity;
      if (rental.status !== undefined) data.status = rental.status;
      return data;
    },
  });

  return {
    ...base,
    getOne: async (where) => {
      if (where) {
        for (const f of where) {
          const fieldNames = Array.isArray(f.field) ? f.field.map(x => x.toString()) : [f.field.toString()];
          if (fieldNames.includes('startDateTime') || fieldNames.includes('endDateTime')) {
            if (Array.isArray(f.value)) {
              f.value = f.value.map(v => (v instanceof Date) ? v : (v ? new Date(v as string) : v)) as WhereField['value'];
            } else if (f.value !== undefined && f.value !== null) {
              f.value = (f.value instanceof Date) ? f.value : new Date(f.value as string);
            }
          }
        }
      }
      return base.getOne(where);
    },
    getAll: async (input) => {
      if (input?.where?.fields) {
        for (const f of input.where.fields) {
          const fieldNames = Array.isArray(f.field) ? f.field.map(x => x.toString()) : [f.field.toString()];
          if (fieldNames.includes('startDateTime') || fieldNames.includes('endDateTime')) {
            if (Array.isArray(f.value)) {
              f.value = f.value.map(v => (v instanceof Date) ? v : (v ? new Date(v as string) : v)) as WhereField['value'];
            } else if (f.value !== undefined && f.value !== null) {
              f.value = (f.value instanceof Date) ? f.value : new Date(f.value as string);
            }
          }
        }
      }
      return base.getAll(input);
    }
  };
};
