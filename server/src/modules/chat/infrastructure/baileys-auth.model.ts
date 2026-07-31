import mongoose, { Schema, Document } from "mongoose";

export interface IBaileysCredsDocument extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: string;
  creds: string;
}

export interface IBaileysKeyDocument extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: string;
  category: string;
  keyId: string;
  data: string;
}

const baileysCredsSchema = new Schema<IBaileysCredsDocument>({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  creds: {
    type: String,
    required: true,
  },
});

const baileysKeySchema = new Schema<IBaileysKeyDocument>({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  keyId: {
    type: String,
    required: true,
    index: true,
  },
  data: {
    type: String,
    required: true,
  },
});

baileysKeySchema.index({ sessionId: 1, category: 1, keyId: 1 }, { unique: true });

export const BaileysCredsModel =
  (mongoose.models.BaileysCreds as mongoose.Model<IBaileysCredsDocument>) ||
  mongoose.model<IBaileysCredsDocument>("BaileysCreds", baileysCredsSchema);

export const BaileysKeyModel =
  (mongoose.models.BaileysKey as mongoose.Model<IBaileysKeyDocument>) ||
  mongoose.model<IBaileysKeyDocument>("BaileysKey", baileysKeySchema);

export default BaileysCredsModel;
