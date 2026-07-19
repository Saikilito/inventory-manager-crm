import mongoose, { Schema, Document } from "mongoose";
import { IOrder } from "../../../../../shared-domain/src/order/order.entity.js";

export interface IOrderDocument extends Omit<IOrder, "id">, Document {
  _id: mongoose.Types.ObjectId;
  isTesting: boolean;
}

const orderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  purchasePriceAtSale: { type: Number },
  sellingPriceAtSale: { type: Number },
});

const orderSchema = new Schema<IOrderDocument>({
  items: { type: [orderItemSchema], required: true },
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED", "CANCELLED"],
    default: "PENDING",
  },
  sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isTesting: { type: Boolean, default: false, index: true },
});

export const OrderModel = (mongoose.models.Order as mongoose.Model<IOrderDocument>) || mongoose.model<IOrderDocument>("Order", orderSchema);
export default OrderModel;
