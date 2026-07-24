import mongoose from 'mongoose';
import { IAccountsPayableRepository } from '../../application/repositories/accounts-payable.repository.js';
import { IAccountsPayable, makeAccountsPayable, makePaymentRecord } from '../../../../../../shared-domain/src/financial/accounts-payable.entity.js';
import AccountsPayableModel, { IAccountsPayableDocument } from '../accounts-payable.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';

const mapToDomain = (doc: IAccountsPayableDocument): IAccountsPayable => {
  const payments = doc.payments.map((p) => ({
    id: p._id?.toString(),
    amount: p.amount,
    accountId: p.accountId.toString(),
    transactionId: p.transactionId.toString(),
    expenseId: p.expenseId.toString(),
    paidAt: p.paidAt,
  }));

  return makeAccountsPayable({
    id: doc._id.toString(),
    stockLotId: doc.stockLotId?.toString(),
    supplier: doc.supplier,
    totalAmount: doc.totalAmount,
    remainingBalance: doc.remainingBalance,
    payments: payments.map((p) => makePaymentRecord({
      id: p.id,
      amount: p.amount,
      accountId: p.accountId,
      transactionId: p.transactionId,
      expenseId: p.expenseId,
      paidAt: p.paidAt,
    })),
    status: doc.status,
    contextId: doc.contextId?.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
};

export const makeAccountsPayableMongooseRepository = (): IAccountsPayableRepository => {
  const base = makeMongooseBaseRepository<IAccountsPayable, IAccountsPayableDocument>({
    model: AccountsPayableModel,
    mapToDomain,
    mapToDocumentData: (payable) => {
      const data: Record<string, unknown> = {};
      
      if (payable.stockLotId !== undefined) {
        data.stockLotId = new mongoose.Types.ObjectId(payable.stockLotId.toString());
      }
      if (payable.supplier !== undefined) data.supplier = payable.supplier;
      if (payable.totalAmount !== undefined) data.totalAmount = payable.totalAmount;
      if (payable.remainingBalance !== undefined) data.remainingBalance = payable.remainingBalance;
      
      if (payable.payments !== undefined) {
        data.payments = payable.payments.map((p) => ({
          _id: p.id ? new mongoose.Types.ObjectId(p.id.toString()) : new mongoose.Types.ObjectId(),
          amount: p.amount,
          accountId: new mongoose.Types.ObjectId(p.accountId.toString()),
          transactionId: new mongoose.Types.ObjectId(p.transactionId.toString()),
          expenseId: new mongoose.Types.ObjectId(p.expenseId.toString()),
          paidAt: p.paidAt,
        }));
      }
      
      if (payable.status !== undefined) data.status = payable.status;
      
      if (payable.contextId !== undefined) {
        data.contextId = payable.contextId ? new mongoose.Types.ObjectId(payable.contextId.toString()) : null;
      }

      return data as Partial<IAccountsPayableDocument>;
    },
  });

  return {
    ...base,

    async findByStatus(status: string, contextId?: string): Promise<IAccountsPayable[]> {
      const filter: Record<string, unknown> = { status };
      
      if (contextId) {
        filter.contextId = new mongoose.Types.ObjectId(contextId);
      }
      
      const docs = await AccountsPayableModel.find(filter).exec();
      return docs.map(mapToDomain);
    },

    async findBySupplier(supplier: string, contextId?: string): Promise<IAccountsPayable[]> {
      const filter: Record<string, unknown> = {
        supplier: { $regex: supplier, $options: 'i' },
      };
      
      if (contextId) {
        filter.contextId = new mongoose.Types.ObjectId(contextId);
      }
      
      const docs = await AccountsPayableModel.find(filter).exec();
      return docs.map(mapToDomain);
    },
  };
};
