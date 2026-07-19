import mongoose, { Schema, Document } from "mongoose";

export interface IUnsatisfiedDemandDocument extends Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  clientPhone: string;
  productName: string;
  quantity: number;
  requestedAt: string;
}

const unsatisfiedDemandSchema = new Schema<IUnsatisfiedDemandDocument>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  clientPhone: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  requestedAt: {
    type: String,
    required: true,
  },
});

export const UnsatisfiedDemandModel =
  (mongoose.models.UnsatisfiedDemand as mongoose.Model<IUnsatisfiedDemandDocument>) ||
  mongoose.model<IUnsatisfiedDemandDocument>(
    "UnsatisfiedDemand",
    unsatisfiedDemandSchema
  );

export default UnsatisfiedDemandModel;
