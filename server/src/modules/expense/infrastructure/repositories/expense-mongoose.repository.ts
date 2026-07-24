import mongoose from 'mongoose';
import { IExpenseRepository } from '../../application/repositories/expense.repository.js';
import { IExpense, makeExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import ExpenseModel, { IExpenseDocument } from '../expense.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';
import { Id } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { doTryResult } from '../../../../../../shared-domain/src/shared/do-try-result.js';

const mapToDomain = (doc: IExpenseDocument): IExpense => {
  return makeExpense({
    id: doc._id.toString(),
    amount: doc.amount,
    description: doc.description,
    category: doc.category,
    contextId: doc.contextId ? doc.contextId.toString() : undefined,
    referenceId: doc.referenceId ? doc.referenceId.toString() : undefined,
    referenceType: doc.referenceType ?? undefined,
    accountId: doc.accountId ? doc.accountId.toString() : undefined,
    transactionId: doc.transactionId ? doc.transactionId.toString() : undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
};

const mapToDocumentData = (expense: Partial<IExpense>) => {
  const data: Record<string, unknown> = {};
  if (expense.amount !== undefined) {
    data.amount = expense.amount;
  }
  if (expense.description !== undefined) {
    data.description = expense.description;
  }
  if (expense.category !== undefined) {
    data.category = expense.category;
  }
  if (expense.contextId !== undefined) {
    data.contextId = expense.contextId ? new mongoose.Types.ObjectId(expense.contextId.toString()) : null;
  }
  if (expense.referenceId !== undefined) {
    const refStr = expense.referenceId ? expense.referenceId.toString() : '';
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(refStr);
    data.referenceId = expense.referenceId 
      ? (isObjectId ? new mongoose.Types.ObjectId(refStr) : refStr) 
      : null;
  }
  if (expense.referenceType !== undefined) {
    data.referenceType = expense.referenceType ?? null;
  }
  if (expense.accountId !== undefined) {
    data.accountId = expense.accountId ? new mongoose.Types.ObjectId(expense.accountId.toString()) : null;
  }
  if (expense.transactionId !== undefined) {
    data.transactionId = expense.transactionId ? new mongoose.Types.ObjectId(expense.transactionId.toString()) : null;
  }
  if (expense.createdAt !== undefined) {
    data.createdAt = expense.createdAt;
  }
  if (expense.updatedAt !== undefined) {
    data.updatedAt = expense.updatedAt;
  }
  return data;
};

export const makeExpenseMongooseRepository = (): IExpenseRepository => {
  const baseRepo = makeMongooseBaseRepository<IExpense, IExpenseDocument>({
    model: ExpenseModel,
    mapToDomain,
    mapToDocumentData,
  });

  return {
    ...baseRepo,
    async dissociateByContextId(contextId: Id): Promise<Result<void, DatabaseError>> {
      return doTryResult(
        async () => {
          await ExpenseModel.updateMany(
            { contextId: new mongoose.Types.ObjectId(contextId.toString()) },
            { $set: { contextId: null } }
          ).exec();
        },
        (err) => createDatabaseError(err.message)
      );
    }
  };
};
