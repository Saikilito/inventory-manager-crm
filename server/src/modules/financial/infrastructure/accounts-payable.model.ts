import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IPaymentRecordDocument {
  _id?: mongoose.Types.ObjectId;
  amount: number;
  accountId: mongoose.Types.ObjectId;
  transactionId: mongoose.Types.ObjectId;
  expenseId: mongoose.Types.ObjectId;
  paidAt: Date;
}

export interface IAccountsPayableDocument extends mongoose.Document {
  stockLotId?: mongoose.Types.ObjectId;
  supplier: string;
  totalAmount: number;
  remainingBalance: number;
  payments: IPaymentRecordDocument[];
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  contextId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const PaymentRecordSchema = new Schema<IPaymentRecordDocument>(
  {
    amount: { type: Number, required: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
    expenseId: { type: Schema.Types.ObjectId, ref: 'Expense', required: true },
    paidAt: { type: Date, required: true, default: Date.now },
  },
  { _id: true },
);

const AccountsPayableSchema = new Schema<IAccountsPayableDocument>(
  {
    stockLotId: { type: Schema.Types.ObjectId, ref: 'StockLot' },
    supplier: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true },
    remainingBalance: { type: Number, required: true },
    payments: { type: [PaymentRecordSchema], default: [] },
    status: { type: String, enum: ['PENDING', 'PARTIAL', 'PAID'], required: true, default: 'PENDING' },
    contextId: { type: Schema.Types.ObjectId, ref: 'Context' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    versionKey: '__v',
  },
);

AccountsPayableSchema.index({ supplier: 1 });
AccountsPayableSchema.index({ status: 1 });
AccountsPayableSchema.index({ contextId: 1 });
AccountsPayableSchema.index({ stockLotId: 1 });

const AccountsPayableModel = mongoose.model<IAccountsPayableDocument>('AccountsPayable', AccountsPayableSchema);

export default AccountsPayableModel;
