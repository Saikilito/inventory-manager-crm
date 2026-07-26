import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IStockLotItemDocument {
  productId?: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitCost: number;
  confirmedSellingPrice: number;
  isNewProduct: boolean;
  projectedProfit?: number;
}

export interface IStockLotDocument extends mongoose.Document {
  supplier: string;
  purchaseDate: string;
  items: IStockLotItemDocument[];
  totalCost: number;
  projectedProfit?: number;
  paymentMethod: 'CASH' | 'CREDIT';
  transactionId?: mongoose.Types.ObjectId;
  accountsPayableId?: mongoose.Types.ObjectId;
  status: 'DRAFT' | 'RECEIVED' | 'PARTIAL' | 'PAID';
  notes?: string;
  contextId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const StockLotItemSchema = new Schema<IStockLotItemDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    confirmedSellingPrice: { type: Number, required: true },
    isNewProduct: { type: Boolean, required: true, default: false },
    projectedProfit: { type: Number },
  },
  { _id: false },
);

const StockLotSchema = new Schema<IStockLotDocument>(
  {
    supplier: { type: String, required: true, trim: true },
    purchaseDate: { type: String, required: true },
    items: { type: [StockLotItemSchema], required: true },
    totalCost: { type: Number, required: true },
    projectedProfit: { type: Number },
    paymentMethod: { type: String, enum: ['CASH', 'CREDIT'], required: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    accountsPayableId: { type: Schema.Types.ObjectId, ref: 'AccountsPayable' },
    status: { type: String, enum: ['DRAFT', 'RECEIVED', 'PARTIAL', 'PAID'], required: true, default: 'RECEIVED' },
    notes: { type: String, trim: true },
    contextId: { type: Schema.Types.ObjectId, ref: 'Context' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    versionKey: '__v',
  },
);

StockLotSchema.index({ supplier: 1, purchaseDate: -1 });
StockLotSchema.index({ contextId: 1 });
StockLotSchema.index({ status: 1 });
StockLotSchema.index({ paymentMethod: 1 });

const StockLotModel = mongoose.model<IStockLotDocument>('StockLot', StockLotSchema);

export default StockLotModel;
