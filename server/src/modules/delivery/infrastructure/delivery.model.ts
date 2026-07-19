import mongoose, { Schema, Document } from "mongoose";
import { IDelivery } from "../../../../../shared-domain/src/delivery/delivery.entity.js";

export interface IDeliveryDocument extends Omit<IDelivery, "id">, Document {
  _id: mongoose.Types.ObjectId;
  isTesting?: boolean;
}

const deliverySchema = new Schema<IDeliveryDocument>({
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
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

export const DeliveryModel = mongoose.models.Delivery || mongoose.model<IDeliveryDocument>("Delivery", deliverySchema);

const deliveryCapacitySchema = new Schema({
  isTesting: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

export const DeliveryCapacityModel = mongoose.models.DeliveryCapacity || mongoose.model("DeliveryCapacity", deliveryCapacitySchema);

export default DeliveryModel;
