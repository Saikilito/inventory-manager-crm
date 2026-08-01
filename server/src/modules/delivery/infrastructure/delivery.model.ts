import mongoose, { Schema, Document } from 'mongoose';
import { IDelivery } from '../../../../../shared-domain/src/delivery/delivery.entity.js';
import { DELIVERY_STATUSES } from '../../../../../shared-domain/src/delivery/delivery-status.js';

export interface IDeliveryDocument extends Omit<IDelivery, 'id' | 'orderId'>, Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  isTesting?: boolean;
}

const deliverySchema = new Schema<IDeliveryDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    scheduledDate: { type: String, required: true }, // Saved as ISO/Caracas string from DateTimeVO
    deliveryTime: { type: String, default: '' },
    address: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: DELIVERY_STATUSES,
      default: 'PENDING',
    },
    notes: { type: String, default: '' },
    deliveryCost: { type: Number, default: null },
    isTesting: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  },
);

deliverySchema.index({ scheduledDate: 1, deliveryTime: 1 });
deliverySchema.index({ orderId: 1 });

export const DeliveryModel =
  (mongoose.models.Delivery as mongoose.Model<IDeliveryDocument>) ||
  mongoose.model<IDeliveryDocument>('Delivery', deliverySchema);

export interface IDeliveryCapacityDocument extends Document {
  isTesting?: boolean;
}

const deliveryCapacitySchema = new Schema<IDeliveryCapacityDocument>(
  {
    isTesting: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  },
);

export const DeliveryCapacityModel =
  (mongoose.models.DeliveryCapacity as mongoose.Model<IDeliveryCapacityDocument>) ||
  mongoose.model<IDeliveryCapacityDocument>('DeliveryCapacity', deliveryCapacitySchema);

export default DeliveryModel;
