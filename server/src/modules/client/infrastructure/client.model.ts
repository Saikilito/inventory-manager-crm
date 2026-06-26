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
  age: { type: Number },
  type: { type: String, required: true },
  orders: { type: [String], default: [] },
  sellerId: { type: Schema.Types.ObjectId as any, ref: "User", required: true },
  isTesting: { type: Boolean, default: false, index: true },
});

export const ClientModel = mongoose.model<IClientDocument>(
  "Client",
  clientSchema,
);
export default ClientModel;
