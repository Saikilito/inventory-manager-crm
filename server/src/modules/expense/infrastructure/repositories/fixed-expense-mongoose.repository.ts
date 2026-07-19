import mongoose from 'mongoose';
import { IFixedExpenseRepository, IFixedExpensePaymentRepository } from '../../application/repositories/fixed-expense.repository.js';
import { IFixedExpense, IFixedExpensePayment, makeFixedExpense, makeFixedExpensePayment } from '../../../../../../shared-domain/src/expense/fixed-expense.entity.js';
import { FixedExpenseModel, FixedExpensePaymentModel, IFixedExpenseDocument, IFixedExpensePaymentDocument } from '../fixed-expense.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';
import { Id } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { doTryResult } from '../../../../../../shared-domain/src/shared/do-try-result.js';

const mapToDomain = (doc: IFixedExpenseDocument): IFixedExpense => {
  return makeFixedExpense({
    id: doc._id.toString(),
    name: doc.name,
    category: doc.category,
    amount: doc.amount,
    isActive: doc.isActive,
    contextId: doc.contextId ? doc.contextId.toString() : undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
};

const mapToDocumentData = (expense: Partial<IFixedExpense>) => {
  const data: Record<string, unknown> = {};
  if (expense.name !== undefined) {
    data.name = expense.name;
  }
  if (expense.category !== undefined) {
    data.category = expense.category;
  }
  if (expense.amount !== undefined) {
    data.amount = expense.amount;
  }
  if (expense.isActive !== undefined) {
    data.isActive = expense.isActive;
  }
  if (expense.contextId !== undefined) {
    data.contextId = expense.contextId ? new mongoose.Types.ObjectId(expense.contextId.toString()) : null;
  }
  if (expense.createdAt !== undefined) {
    data.createdAt = expense.createdAt;
  }
  if (expense.updatedAt !== undefined) {
    data.updatedAt = expense.updatedAt;
  }
  return data;
};

export const makeFixedExpenseMongooseRepository = (): IFixedExpenseRepository => {
  const baseRepo = makeMongooseBaseRepository<IFixedExpense, IFixedExpenseDocument>({
    model: FixedExpenseModel,
    mapToDomain,
    mapToDocumentData,
  });

  return {
    ...baseRepo,
    async dissociateByContextId(contextId: Id): Promise<Result<void, DatabaseError>> {
      return doTryResult(
        async () => {
          await FixedExpenseModel.updateMany(
            { contextId: new mongoose.Types.ObjectId(contextId.toString()) },
            { $set: { contextId: null } }
          ).exec();
        },
        (err) => new DatabaseError(err.message)
      );
    }
  };
};

const mapToDomainPayment = (doc: IFixedExpensePaymentDocument): IFixedExpensePayment => {
  return makeFixedExpensePayment({
    id: doc._id.toString(),
    fixedExpenseId: doc.fixedExpenseId.toString(),
    billingMonth: doc.billingMonth,
    isPaid: doc.isPaid,
    amountPaid: doc.amountPaid,
    paidAt: doc.paidAt ?? undefined,
    generatedExpenseId: doc.generatedExpenseId ? doc.generatedExpenseId.toString() : undefined,
    contextId: doc.contextId ? doc.contextId.toString() : undefined,
  });
};

const mapToDocumentDataPayment = (payment: Partial<IFixedExpensePayment>) => {
  const data: Record<string, unknown> = {};
  if (payment.fixedExpenseId !== undefined) {
    data.fixedExpenseId = payment.fixedExpenseId ? new mongoose.Types.ObjectId(payment.fixedExpenseId.toString()) : null;
  }
  if (payment.billingMonth !== undefined) {
    data.billingMonth = payment.billingMonth;
  }
  if (payment.isPaid !== undefined) {
    data.isPaid = payment.isPaid;
  }
  if (payment.amountPaid !== undefined) {
    data.amountPaid = payment.amountPaid;
  }
  if (payment.paidAt !== undefined) {
    data.paidAt = payment.paidAt;
  }
  if (payment.generatedExpenseId !== undefined) {
    data.generatedExpenseId = payment.generatedExpenseId ? new mongoose.Types.ObjectId(payment.generatedExpenseId.toString()) : null;
  }
  if (payment.contextId !== undefined) {
    data.contextId = payment.contextId ? new mongoose.Types.ObjectId(payment.contextId.toString()) : null;
  }
  return data;
};

export const makeFixedExpensePaymentMongooseRepository = (): IFixedExpensePaymentRepository => {
  const baseRepo = makeMongooseBaseRepository<IFixedExpensePayment, IFixedExpensePaymentDocument>({
    model: FixedExpensePaymentModel,
    mapToDomain: mapToDomainPayment,
    mapToDocumentData: mapToDocumentDataPayment,
  });

  return {
    ...baseRepo,
    async getByMonthAndExpense(fixedExpenseId: Id, billingMonth: string): Promise<Result<IFixedExpensePayment | null, DatabaseError>> {
      return doTryResult(
        async () => {
          const doc = await FixedExpensePaymentModel.findOne({
            fixedExpenseId: new mongoose.Types.ObjectId(fixedExpenseId.toString()),
            billingMonth,
          }).exec();
          if (!doc) {
            return null;
          }
          return mapToDomainPayment(doc);
        },
        (err) => new DatabaseError(err.message)
      );
    }
  };
};
