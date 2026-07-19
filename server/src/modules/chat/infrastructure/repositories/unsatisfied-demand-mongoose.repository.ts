import mongoose from "mongoose";
import {
  IUnsatisfiedDemandRepository,
  IUnsatisfiedDemand,
  makeUnsatisfiedDemand,
} from "../../application/repositories/unsatisfied-demand.repository.js";
import {
  UnsatisfiedDemandModel,
  IUnsatisfiedDemandDocument,
} from "../unsatisfied-demand.model.js";
import { makeMongooseBaseRepository } from "../../../shared/infrastructure/repositories/mongoose-base.repository.js";

const mapToDomain = (doc: IUnsatisfiedDemandDocument): IUnsatisfiedDemand => {
  return makeUnsatisfiedDemand({
    id: doc._id.toString(),
    productId: doc.productId.toString(),
    clientPhone: doc.clientPhone,
    productName: doc.productName,
    quantity: doc.quantity,
    requestedAt: doc.requestedAt,
  });
};

export const makeUnsatisfiedDemandMongooseRepository =
  (): IUnsatisfiedDemandRepository => {
    return makeMongooseBaseRepository<
      IUnsatisfiedDemand,
      IUnsatisfiedDemandDocument
    >({
      model: UnsatisfiedDemandModel,
      mapToDomain,
      mapToDocumentData: (demand) => {
        const data: Partial<IUnsatisfiedDemandDocument> = {};
        if (demand.productId !== undefined) {
          data.productId = new mongoose.Types.ObjectId(
            demand.productId.toString()
          ) as IUnsatisfiedDemandDocument["productId"];
        }
        if (demand.clientPhone !== undefined) {
          data.clientPhone = demand.clientPhone.toString();
        }
        if (demand.productName !== undefined) {
          data.productName = demand.productName.toString();
        }
        if (demand.quantity !== undefined) {
          data.quantity = Number(demand.quantity);
        }
        if (demand.requestedAt !== undefined) {
          data.requestedAt = demand.requestedAt.toString();
        }
        return data;
      },
    });
  };

export default makeUnsatisfiedDemandMongooseRepository;
