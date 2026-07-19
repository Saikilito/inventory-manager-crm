import mongoose, { Schema, Document } from "mongoose";
import { IClient } from "../../../../../shared-domain/src/client/client.entity.js";

export interface IClientDocument extends Omit<IClient, "id">, Document {
  _id: mongoose.Types.ObjectId;
  isTesting: boolean;
}

const clientSchema = new Schema<IClientDocument>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address: { type: String, required: true },
  whatsapp: { type: String, required: true },
  nationalId: { type: String, required: true },
  type: { type: String, required: true },
  orders: { type: [String], default: [] },
  sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isTesting: { type: Boolean, default: false, index: true },
});

export const ClientModel = (mongoose.models.Client as mongoose.Model<IClientDocument>) || mongoose.model<IClientDocument>(
  "Client",
  clientSchema,
);
export default ClientModel;
