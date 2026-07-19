import mongoose, { Schema, Document } from "mongoose";
import { IFixedExpense, IFixedExpensePayment } from "../../../../../shared-domain/src/expense/fixed-expense.entity.js";

export interface IFixedExpenseDocument extends Omit<IFixedExpense, "id" | "contextId" | "amount" | "name" | "createdAt" | "updatedAt">, Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  contextId?: mongoose.Types.ObjectId | null;
  createdAt: string;
  updatedAt: string;
  isTesting: boolean;
}

export interface IFixedExpensePaymentDocument extends Omit<IFixedExpensePayment, "id" | "fixedExpenseId" | "generatedExpenseId" | "contextId" | "amountPaid" | "billingMonth" | "paidAt">, Document {
  _id: mongoose.Types.ObjectId;
  fixedExpenseId: mongoose.Types.ObjectId;
  billingMonth: string;
  amountPaid: number;
  paidAt?: string | null;
  generatedExpenseId?: mongoose.Types.ObjectId | null;
  contextId?: mongoose.Types.ObjectId | null;
  isTesting: boolean;
}

const fixedExpenseSchema = new Schema<IFixedExpenseDocument>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  contextId: { type: Schema.Types.ObjectId, ref: "Context", default: null },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
  isTesting: { type: Boolean, default: false, index: true },
});

fixedExpenseSchema.index({ contextId: 1 });

const fixedExpensePaymentSchema = new Schema<IFixedExpensePaymentDocument>({
  fixedExpenseId: { type: Schema.Types.ObjectId, ref: "FixedExpense", required: true },
  billingMonth: { type: String, required: true },
  isPaid: { type: Boolean, default: false },
  amountPaid: { type: Number, required: true },
  paidAt: { type: String, default: null },
  generatedExpenseId: { type: Schema.Types.ObjectId, ref: "Expense", default: null },
  contextId: { type: Schema.Types.ObjectId, ref: "Context", default: null },
  isTesting: { type: Boolean, default: false, index: true },
});

fixedExpensePaymentSchema.index({ contextId: 1 });
fixedExpensePaymentSchema.index({ fixedExpenseId: 1, billingMonth: 1 }, { unique: true });

export const FixedExpenseModel = (mongoose.models.FixedExpense as mongoose.Model<IFixedExpenseDocument>) || mongoose.model<IFixedExpenseDocument>(
  "FixedExpense",
  fixedExpenseSchema
);

export const FixedExpensePaymentModel = (mongoose.models.FixedExpensePayment as mongoose.Model<IFixedExpensePaymentDocument>) || mongoose.model<IFixedExpensePaymentDocument>(
  "FixedExpensePayment",
  fixedExpensePaymentSchema
);
