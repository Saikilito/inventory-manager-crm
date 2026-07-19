import mongoose from 'mongoose';
import { IAccountRepository, ITransactionRepository, IExchangeRateRepository, IFinancialDayRepository } from '../../application/repositories/financial.repository.js';
import { IAccount, makeAccount } from '../../../../../../shared-domain/src/financial/account.entity.js';
import { ITransaction, makeTransaction } from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { IExchangeRate, makeExchangeRate } from '../../../../../../shared-domain/src/financial/exchange-rate.entity.js';
import { IFinancialDay, IFinancialDayBalance, makeFinancialDay } from '../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { AccountModel, TransactionModel, ExchangeRateModel, FinancialDayModel, IAccountDocument, ITransactionDocument, IExchangeRateDocument, IFinancialDayDocument } from '../financial.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';

const mapAccountToDomain = (doc: IAccountDocument): IAccount => {
  return makeAccount({
    id: doc._id.toString(),
    name: doc.name,
    currency: doc.currency,
    balance: doc.balance,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
};

const mapAccountToDocumentData = (account: IAccount) => {
  const data: Partial<IAccountDocument> = {};
  if (account.name !== undefined) data.name = account.name.toString();
  if (account.currency !== undefined) data.currency = account.currency.toString();
  if (account.balance !== undefined) data.balance = account.balance;
  if (account.createdAt !== undefined) data.createdAt = account.createdAt.toString();
  if (account.updatedAt !== undefined) data.updatedAt = account.updatedAt.toString();
  return data;
};

export const makeAccountMongooseRepository = (): IAccountRepository => {
  return makeMongooseBaseRepository<IAccount, IAccountDocument>({
    model: AccountModel,
    mapToDomain: mapAccountToDomain,
    mapToDocumentData: mapAccountToDocumentData,
  });
};

const mapTransactionToDomain = (doc: ITransactionDocument): ITransaction => {
  return makeTransaction({
    id: doc._id.toString(),
    accountId: doc.accountId.toString(),
    type: doc.type,
    amount: doc.amount,
    currency: doc.currency,
    description: doc.description,
    date: doc.date,
    financialDayId: doc.financialDayId.toString(),
    referenceId: doc.referenceId ? doc.referenceId.toString() : undefined,
    createdAt: doc.createdAt,
  });
};

const mapTransactionToDocumentData = (tx: ITransaction) => {
  const data: Partial<ITransactionDocument> = {};
  if (tx.accountId !== undefined) data.accountId = new mongoose.Types.ObjectId(tx.accountId.toString());
  if (tx.type !== undefined) data.type = tx.type;
  if (tx.amount !== undefined) data.amount = tx.amount;
  if (tx.currency !== undefined) data.currency = tx.currency.toString();
  if (tx.description !== undefined) data.description = tx.description.toString();
  if (tx.date !== undefined) data.date = tx.date.toString();
  if (tx.financialDayId !== undefined) data.financialDayId = new mongoose.Types.ObjectId(tx.financialDayId.toString());
  if (tx.referenceId !== undefined) {
    const refStr = tx.referenceId ? tx.referenceId.toString() : '';
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(refStr);
    data.referenceId = tx.referenceId
      ? (isObjectId ? new mongoose.Types.ObjectId(refStr) : refStr)
      : undefined;
  }
  if (tx.createdAt !== undefined) data.createdAt = tx.createdAt.toString();
  return data;
};

export const makeTransactionMongooseRepository = (): ITransactionRepository => {
  return makeMongooseBaseRepository<ITransaction, ITransactionDocument>({
    model: TransactionModel,
    mapToDomain: mapTransactionToDomain,
    mapToDocumentData: mapTransactionToDocumentData,
  });
};

const mapExchangeRateToDomain = (doc: IExchangeRateDocument): IExchangeRate => {
  return makeExchangeRate({
    id: doc._id.toString(),
    date: doc.date,
    rate: doc.rate,
    createdAt: doc.createdAt,
  });
};

const mapExchangeRateToDocumentData = (rate: IExchangeRate) => {
  const data: Partial<IExchangeRateDocument> = {};
  if (rate.date !== undefined) data.date = rate.date.toString();
  if (rate.rate !== undefined) data.rate = rate.rate;
  if (rate.createdAt !== undefined) data.createdAt = rate.createdAt.toString();
  return data;
};

export const makeExchangeRateMongooseRepository = (): IExchangeRateRepository => {
  return makeMongooseBaseRepository<IExchangeRate, IExchangeRateDocument>({
    model: ExchangeRateModel,
    mapToDomain: mapExchangeRateToDomain,
    mapToDocumentData: mapExchangeRateToDocumentData,
  });
};

const mapFinancialDayToDomain = (doc: IFinancialDayDocument): IFinancialDay => {
  return makeFinancialDay({
    id: doc._id.toString(),
    date: doc.date,
    status: doc.status,
    openingBalances: doc.openingBalances.map(b => ({ accountId: b.accountId.toString(), balance: b.balance })),
    closingBalances: doc.closingBalances.map(b => ({ accountId: b.accountId.toString(), balance: b.balance })),
    openedAt: doc.openedAt,
    closedAt: doc.closedAt ?? undefined,
  });
};

const mapFinancialDayToDocumentData = (fd: IFinancialDay) => {
  const data: Partial<IFinancialDayDocument> = {};
  if (fd.date !== undefined) data.date = fd.date.toString();
  if (fd.status !== undefined) data.status = fd.status;
  if (fd.openingBalances !== undefined) {
    data.openingBalances = fd.openingBalances.map((b: IFinancialDayBalance) => ({
      accountId: new mongoose.Types.ObjectId(b.accountId.toString()),
      balance: b.balance,
    }));
  }
  if (fd.closingBalances !== undefined) {
    data.closingBalances = fd.closingBalances.map((b: IFinancialDayBalance) => ({
      accountId: new mongoose.Types.ObjectId(b.accountId.toString()),
      balance: b.balance,
    }));
  }
  if (fd.openedAt !== undefined) data.openedAt = fd.openedAt.toString();
  if (fd.closedAt !== undefined) data.closedAt = fd.closedAt.toString();
  return data;
};

export const makeFinancialDayMongooseRepository = (): IFinancialDayRepository => {
  return makeMongooseBaseRepository<IFinancialDay, IFinancialDayDocument>({
    model: FinancialDayModel,
    mapToDomain: mapFinancialDayToDomain,
    mapToDocumentData: mapFinancialDayToDocumentData,
  });
};
