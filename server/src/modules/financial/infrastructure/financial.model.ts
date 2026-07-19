import mongoose, { Schema, Document } from "mongoose";
import { IAccount } from "../../../../../shared-domain/src/financial/account.entity.js";
import { ITransaction } from "../../../../../shared-domain/src/financial/transaction.entity.js";
import { IExchangeRate } from "../../../../../shared-domain/src/financial/exchange-rate.entity.js";
import { IFinancialDay } from "../../../../../shared-domain/src/financial/financial-day.entity.js";

export interface IAccountDocument extends Omit<IAccount, "id">, Document {
  _id: mongoose.Types.ObjectId;
  isTesting: boolean;
}

export interface ITransactionDocument extends Omit<ITransaction, "id" | "accountId" | "financialDayId" | "referenceId">, Document {
  _id: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  financialDayId: mongoose.Types.ObjectId;
  referenceId?: mongoose.Types.ObjectId | string;
  isTesting: boolean;
}

export interface IExchangeRateDocument extends Omit<IExchangeRate, "id">, Document {
  _id: mongoose.Types.ObjectId;
  isTesting: boolean;
}

export interface IFinancialDayDocument extends Omit<IFinancialDay, "id" | "openingBalances" | "closingBalances">, Document {
  _id: mongoose.Types.ObjectId;
  openingBalances: Array<{ accountId: mongoose.Types.ObjectId; balance: number }>;
  closingBalances: Array<{ accountId: mongoose.Types.ObjectId; balance: number }>;
  isTesting: boolean;
}

const accountSchema = new Schema<IAccountDocument>({
  name: { type: String, required: true, unique: true },
  currency: { type: String, required: true },
  balance: { type: Number, default: 0 },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
  isTesting: { type: Boolean, default: false, index: true },
});

const transactionSchema = new Schema<ITransactionDocument>({
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  financialDayId: { type: Schema.Types.ObjectId, ref: "FinancialDay", required: true },
  referenceId: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: String, required: true },
  isTesting: { type: Boolean, default: false, index: true },
});

transactionSchema.index({ accountId: 1, date: -1 });

const exchangeRateSchema = new Schema<IExchangeRateDocument>({
  date: { type: String, required: true, unique: true },
  rate: { type: Number, required: true },
  createdAt: { type: String, required: true },
  isTesting: { type: Boolean, default: false, index: true },
});

const balanceSchema = new Schema({
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  balance: { type: Number, required: true, default: 0 },
}, { _id: false });

const financialDaySchema = new Schema<IFinancialDayDocument>({
  date: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  openingBalances: { type: [balanceSchema], default: [] },
  closingBalances: { type: [balanceSchema], default: [] },
  openedAt: { type: String, required: true },
  closedAt: { type: String, default: null },
  isTesting: { type: Boolean, default: false, index: true },
});

export const AccountModel = mongoose.models.Account || mongoose.model<IAccountDocument>("Account", accountSchema);
export const TransactionModel = mongoose.models.Transaction || mongoose.model<ITransactionDocument>("Transaction", transactionSchema);
export const ExchangeRateModel = mongoose.models.ExchangeRate || mongoose.model<IExchangeRateDocument>("ExchangeRate", exchangeRateSchema);
export const FinancialDayModel = mongoose.models.FinancialDay || mongoose.model<IFinancialDayDocument>("FinancialDay", financialDaySchema);
