import mongoose, { Schema, Document } from "mongoose";

export interface IContextAttributeSubDocument {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

export interface IContextDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  attributes: IContextAttributeSubDocument[];
}

const contextSchema = new Schema<IContextDocument>({
  name: { type: String, required: true, unique: true },
  attributes: [{
    _id: false,
    name: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, required: true, enum: ['STRING', 'NUMBER', 'BOOLEAN', 'MULTIPLE'] },
    required: { type: Boolean, required: true, default: false }
  }]
});

export const ContextModel = mongoose.models.Context || mongoose.model<IContextDocument>(
  "Context",
  contextSchema
);
export default ContextModel;
