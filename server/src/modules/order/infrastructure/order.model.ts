import mongoose, { Schema, Document } from 'mongoose';
import { IOrder } from '../../../../../shared-domain/src/order/order.entity.js';

export interface IOrderDocument
  extends Omit<IOrder, 'id' | 'clientId' | 'sellerId' | 'contextId' | 'deliveryId' | 'items' | 'payments'>, Document {
  _id: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  contextId?: mongoose.Types.ObjectId | null;
  deliveryId?: mongoose.Types.ObjectId | null;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    quantity: number;
    purchasePriceAtSale?: number;
    sellingPriceAtSale?: number;
  }>;
  payments?: Array<{
    accountId: mongoose.Types.ObjectId;
    amount: number;
    exchangeRate: number;
  }>;
  isTesting: boolean;
}

const orderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  purchasePriceAtSale: { type: Number },
  sellingPriceAtSale: { type: Number },
});

const orderPaymentSchema = new Schema({
  accountId: { type: Schema.Types.ObjectId, ref: 'FinancialAccount', required: true },
  amount: { type: Number, required: true },
  exchangeRate: { type: Number, required: true },
});

const orderSchema = new Schema<IOrderDocument>({
  items: { type: [orderItemSchema], required: true },
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },

  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'ACTIVE', 'CANCELLED'],
    default: 'PENDING',
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'REFUNDED'],
    default: 'PENDING',
  },
  deliveryStatus: {
    type: String,
    enum: ['PENDING', 'SENT', 'COMPLETE'],
    default: 'PENDING',
  },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contextId: { type: Schema.Types.ObjectId, ref: 'Context', default: null },
  deliveryId: { type: Schema.Types.ObjectId, ref: 'Delivery', default: null },
  deliveryCost: { type: Number, default: null },
  customDeliveryAddress: { type: String, default: null },
  payments: { type: [orderPaymentSchema], default: [] },
  cancellationObservation: { type: String, default: null },
  isTesting: { type: Boolean, default: false, index: true },
});

// Indexes
orderSchema.index({ contextId: 1 });
orderSchema.index({ deliveryId: 1 });
orderSchema.index({ createdAt: 1 });

export const OrderModel =
  (mongoose.models.Order as mongoose.Model<IOrderDocument>) || mongoose.model<IOrderDocument>('Order', orderSchema);
export default OrderModel;
