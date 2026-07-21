import mongoose, { Schema, Document } from "mongoose";
import { IDelivery } from "../../../../../shared-domain/src/delivery/delivery.entity.js";

export interface IDeliveryDocument extends Omit<IDelivery, "id">, Document {
  _id: mongoose.Types.ObjectId;
  isTesting?: boolean;
}

const deliverySchema = new Schema<IDeliveryDocument>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose's Schema.Types.ObjectId typing is incompatible with the strict generics of `Schema<IDeliveryDocument>` when a custom document interface is provided. A full type-safe replacement would require a refactor to use `mongoose.Schema.Types.ObjectId` directly across every Mongoose model in the codebase.
  orderId: { type: Schema.Types.ObjectId as any, ref: "Order", required: true },
  scheduledDate: { type: String, required: true }, // Saved as ISO/Caracas string from DateTimeVO
  deliveryTime: { type: String, required: true },
  address: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ["PENDING", "DISPATCHED", "DELIVERED", "CANCELLED"], 
    default: "PENDING" 
  },
  notes: { type: String, default: "" },
  isTesting: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

// Indexes for performance when searching by date and order
deliverySchema.index({ scheduledDate: 1, deliveryTime: 1 });
deliverySchema.index({ orderId: 1 });

export const DeliveryModel = (mongoose.models.Delivery as mongoose.Model<IDeliveryDocument>) || mongoose.model<IDeliveryDocument>("Delivery", deliverySchema);

export interface IDeliveryCapacityDocument extends Document {
  isTesting?: boolean;
}

const deliveryCapacitySchema = new Schema<IDeliveryCapacityDocument>({
  isTesting: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

export const DeliveryCapacityModel = (mongoose.models.DeliveryCapacity as mongoose.Model<IDeliveryCapacityDocument>) || mongoose.model<IDeliveryCapacityDocument>("DeliveryCapacity", deliveryCapacitySchema);

export default DeliveryModel;
