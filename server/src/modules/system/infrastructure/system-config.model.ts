import mongoose, { Schema, Document } from "mongoose";

export interface ISystemConfigDocument extends Document {
  _id: mongoose.Types.ObjectId;
  rentalsEnabled: boolean;
  updatedAt: Date;
}

const systemConfigSchema = new Schema<ISystemConfigDocument>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    rentalsEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure only one config document exists
systemConfigSchema.index({ _id: 1 }, { unique: true });

export const SystemConfigModel =
  (mongoose.models.SystemConfig as mongoose.Model<ISystemConfigDocument>) ||
  mongoose.model<ISystemConfigDocument>("SystemConfig", systemConfigSchema);

export default SystemConfigModel;
