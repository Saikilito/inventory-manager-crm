import mongoose, { Schema, Document } from "mongoose";
import { IOrder } from "../../../../../shared-domain/src/order/order.entity.js";

export interface IOrderDocument extends Omit<IOrder, "id">, Document {
  _id: mongoose.Types.ObjectId;
  isTesting: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose's Schema.Types.ObjectId typing is incompatible with the strict generics of the custom `IOrderItem` schema when a custom document interface is provided.
const orderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId as any, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  purchasePriceAtSale: { type: Number },
  sellingPriceAtSale: { type: Number },
});

const orderSchema = new Schema<IOrderDocument>({
  items: { type: [orderItemSchema], required: true },
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose's Schema.Types.ObjectId typing is incompatible with the strict generics of `Schema<IOrderDocument>`. See chat-module sibling models for the same workaround.
  clientId: {
    type: Schema.Types.ObjectId as any,
    ref: "Client",
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED", "ACTIVE", "CANCELLED"],
    default: "PENDING",
  },
  paymentStatus: {
    type: String,
    enum: ["PENDING", "PAID", "REFUNDED"],
    default: "PENDING",
  },
  deliveryStatus: {
    type: String,
    enum: ["PENDING", "SENT", "COMPLETE"],
    default: "PENDING",
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose's Schema.Types.ObjectId typing is incompatible with the strict generics of `Schema<IOrderDocument>`.
  sellerId: { type: Schema.Types.ObjectId as any, ref: "User", required: true },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose's Schema.Types.ObjectId typing is incompatible with the strict generics of `Schema<IOrderDocument>`.
  contextId: { type: Schema.Types.ObjectId as any, ref: "Context", default: null },
  isTesting: { type: Boolean, default: false, index: true },
});

export const OrderModel = (mongoose.models.Order as mongoose.Model<IOrderDocument>) || mongoose.model<IOrderDocument>("Order", orderSchema);
export default OrderModel;
