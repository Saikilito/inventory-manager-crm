import mongoose, { Schema, Document } from "mongoose";
import { IRentalReservation } from "../../../../../shared-domain/src/rental/rental.entity.js";

export interface IRentalReservationDocument extends Omit<IRentalReservation, "id" | "startDateTime" | "endDateTime">, Document {
  _id: mongoose.Types.ObjectId;
  startDateTime: Date;
  endDateTime: Date;
  isTesting?: boolean;
}

const rentalSchema = new Schema<IRentalReservationDocument>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  quantity: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ["RESERVED", "ACTIVE", "RETURNED", "OVERDUE", "CANCELLED"],
    default: "RESERVED"
  },
  isTesting: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

// Indexes for overlap queries: product-based and dates
rentalSchema.index({ productId: 1, startDateTime: 1, endDateTime: 1 });
rentalSchema.index({ orderId: 1 });

export const RentalModel = mongoose.models.Rental || mongoose.model<IRentalReservationDocument>("Rental", rentalSchema);
export default RentalModel;
