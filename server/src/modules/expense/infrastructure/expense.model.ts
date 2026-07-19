import mongoose, { Schema, Document } from "mongoose";
import { IExpense } from "../../../../../shared-domain/src/expense/expense.entity.js";

export interface IExpenseDocument extends Omit<IExpense, "id" | "contextId" | "referenceId">, Document {
  _id: mongoose.Types.ObjectId;
  contextId?: mongoose.Types.ObjectId | null;
  referenceId?: mongoose.Types.ObjectId | string | null;
  isTesting: boolean;
}

const expenseSchema = new Schema<IExpenseDocument>({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  contextId: { type: Schema.Types.ObjectId, ref: "Context", default: null },
  referenceId: { type: Schema.Types.Mixed, default: null },
  referenceType: { type: String, default: null },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
  isTesting: { type: Boolean, default: false, index: true },
});

expenseSchema.index({ contextId: 1 });
expenseSchema.index({ referenceId: 1, referenceType: 1 });

export const ExpenseModel = (mongoose.models.Expense as mongoose.Model<IExpenseDocument>) || mongoose.model<IExpenseDocument>(
  "Expense",
  expenseSchema
);

export default ExpenseModel;
