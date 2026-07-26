import mongoose from 'mongoose';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import {
  createDatabaseError,
  createValidationError,
  createNotFoundError,
} from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';
import {
  IAccountsPayable,
  makePaymentRecord,
  addPaymentToAccountsPayable,
} from '../../../../../../shared-domain/src/financial/accounts-payable.entity.js';
import {
  makeTransactionResult,
  ITransaction,
} from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { makeExpense, IExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { IAccountsPayableRepository } from '../repositories/accounts-payable.repository.js';
import {
  IAccountRepository,
  ITransactionRepository,
  IFinancialDayRepository,
} from '../repositories/financial.repository.js';
import { IExpenseRepository } from '../../../expense/application/repositories/expense.repository.js';
import { makeFindOrOpenFinancialDay } from '../services/find-or-open-financial-day.js';
import { AccountModel } from '../../infrastructure/financial.model.js';
import { z } from 'zod';

const PayAccountsPayableInputSchema = z.object({
  accountsPayableId: z.string().min(1, 'Accounts payable ID is required'),
  amount: z.number().positive('Amount must be positive'),
  accountId: z.string().min(1, 'Account ID is required'),
});

export type PayAccountsPayableInput = z.infer<typeof PayAccountsPayableInputSchema>;

export interface PayAccountsPayableOutput {
  accountsPayable: IAccountsPayable;
  transactionId: string;
  expenseId: string;
}

export type PayAccountsPayable = UseCase<PayAccountsPayableInput, PayAccountsPayableOutput, DomainError>;

interface ExpenseCreationInput {
  amount: number;
  description: string;
  category: string;
  date: string;
  contextId?: string;
}

export const makePayAccountsPayable = (deps: {
  accountsPayableRepository: IAccountsPayableRepository;
  accountRepository: IAccountRepository;
  transactionRepository: ITransactionRepository;
  financialDayRepository: IFinancialDayRepository;
  expenseRepository: IExpenseRepository;
}): PayAccountsPayable => {
  const {
    accountsPayableRepository,
    accountRepository,
    transactionRepository,
    financialDayRepository,
    expenseRepository,
  } = deps;

  const findOrOpenFinancialDay = makeFindOrOpenFinancialDay(financialDayRepository, accountRepository);

  return async (input: PayAccountsPayableInput) => {
    const validationResult = PayAccountsPayableInputSchema.safeParse(input);
    if (!validationResult.success) {
      return Result.fail(createValidationError(`Validation failed: ${validationResult.error.message}`));
    }

    const validatedInput = validationResult.data;

    const payableResult = await accountsPayableRepository.getById(IdVO.create(validatedInput.accountsPayableId));
    if (payableResult.isFailure || !payableResult.getValue()) {
      return Result.fail(createNotFoundError('Accounts payable not found'));
    }

    const payable = payableResult.getValue()!;

    if (validatedInput.amount > Number(payable.remainingBalance)) {
      return Result.fail(createDatabaseError('Payment cannot exceed remaining balance'));
    }

    const accountResult = await accountRepository.getById(IdVO.create(validatedInput.accountId));
    if (accountResult.isFailure || !accountResult.getValue()) {
      return Result.fail(createNotFoundError('Account not found'));
    }

    const account = accountResult.getValue()!;

    if (account.balance < validatedInput.amount) {
      return Result.fail(createDatabaseError('Insufficient account balance'));
    }

    const dateStr = DateOnlyVO.create(new Date().toISOString().split('T')[0]);
    const dayResult = await findOrOpenFinancialDay(dateStr.toString());
    if (dayResult.isFailure) {
      return Result.fail(dayResult.getError());
    }

    const financialDay = dayResult.getValue();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transactionResult = makeTransactionResult({
        accountId: validatedInput.accountId,
        type: 'DEBIT',
        amount: validatedInput.amount,
        currency: account.currency.toString(),
        description: `[Pago Proveedor] ${payable.supplier}`,
        date: dateStr.toString(),
        financialDayId: financialDay.id!.toString(),
      });

      if (transactionResult.isFailure) {
        await session.abortTransaction();
        return Result.fail(transactionResult.getError());
      }

      const transaction = transactionResult.getValue();

      const saveTxResult = await transactionRepository.create(transaction, IdVO.generateNil());
      if (saveTxResult.isFailure) {
        await session.abortTransaction();
        return Result.fail(saveTxResult.getError());
      }

      const savedTx = Array.isArray(saveTxResult.getValue())
        ? (saveTxResult.getValue() as ITransaction[])[0]
        : (saveTxResult.getValue() as ITransaction);
      const transactionId = savedTx.id!.toString();

      const expenseInput: ExpenseCreationInput = {
        amount: validatedInput.amount,
        description: `[Pago Proveedor] ${payable.supplier} - Lote ${payable.stockLotId}`,
        category: 'REPLENISHMENT',
        date: dateStr.toString(),
        contextId: payable.contextId?.toString(),
      };

      const expenseEntity = makeExpense(expenseInput);
      const saveExpenseResult = await expenseRepository.create(expenseEntity, IdVO.generateNil());
      if (saveExpenseResult.isFailure) {
        await session.abortTransaction();
        return Result.fail(saveExpenseResult.getError());
      }

      const savedExpense = Array.isArray(saveExpenseResult.getValue())
        ? (saveExpenseResult.getValue() as IExpense[])[0]
        : (saveExpenseResult.getValue() as IExpense);
      const expenseId = savedExpense.id!.toString();

      const paymentRecord = makePaymentRecord({
        amount: validatedInput.amount,
        accountId: validatedInput.accountId,
        transactionId,
        expenseId,
      });

      const updatedPayable = addPaymentToAccountsPayable(payable, paymentRecord);

      const updateResult = await accountsPayableRepository.updateById(
        payable.id!,
        {
          remainingBalance: updatedPayable.remainingBalance,
          payments: updatedPayable.payments,
          status: updatedPayable.status,
        },
        IdVO.generateNil(),
      );

      if (updateResult.isFailure) {
        await session.abortTransaction();
        return Result.fail(updateResult.getError());
      }

      const balanceUpdateResult = await AccountModel.updateOne(
        { _id: new mongoose.Types.ObjectId(validatedInput.accountId) },
        { $inc: { balance: -validatedInput.amount } },
      )
        .session(session)
        .exec();

      if (balanceUpdateResult.modifiedCount === 0) {
        await session.abortTransaction();
        return Result.fail(createDatabaseError('Failed to update account balance'));
      }

      await session.commitTransaction();

      return Result.ok<PayAccountsPayableOutput, DomainError>({
        accountsPayable: updatedPayable,
        transactionId,
        expenseId,
      });
    } catch (error) {
      await session.abortTransaction();
      const message = error instanceof Error ? error.message : 'Unknown error during payment';
      return Result.fail(createDatabaseError(message));
    } finally {
      session.endSession();
    }
  };
};
