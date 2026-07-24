import mongoose from 'mongoose';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { Id, IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { PositiveNumber } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { ITransaction, makeTransactionResult, TransactionType } from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { IAccount, makeAccount } from '../../../../../../shared-domain/src/financial/account.entity.js';
import { TransactionSource } from '../../../../../../shared-domain/src/financial/transaction-source.vo.js';
import { DatabaseError, FinancialIntegrationError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ITransactionRepository, IAccountRepository } from '../repositories/financial.repository.js';

export interface RecordOrderPaymentInput {
  orderId: Id;
  payments: Array<{ accountId: Id; amount: PositiveNumber; exchangeRate?: PositiveNumber }>;
  financialDayId: Id;
}

export interface ReverseOrderPaymentInput {
  orderId: Id;
  amount: PositiveNumber;
  accountId: Id;
  financialDayId: Id;
}

export interface RecordExpenseInput {
  expenseId: Id;
  accountId: Id;
  amount: PositiveNumber;
  financialDayId: Id;
}

export interface ReverseExpenseInput {
  expenseId: Id;
  amount: PositiveNumber;
  accountId: Id;
  financialDayId: Id;
}

export interface RecordDeliveryPaymentInput {
  deliveryId: Id;
  orderId: Id;
  accountId: Id;
  amount: PositiveNumber;
  financialDayId: Id;
}

export type FinancialTransactionService = {
  recordOrderPayment: (input: RecordOrderPaymentInput, session?: mongoose.ClientSession) => Promise<Result<ITransaction[], FinancialIntegrationError | DatabaseError>>;
  reverseOrderPayment: (input: ReverseOrderPaymentInput, session?: mongoose.ClientSession) => Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>>;
  recordExpense: (input: RecordExpenseInput, session?: mongoose.ClientSession) => Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>>;
  reverseExpense: (input: ReverseExpenseInput, session?: mongoose.ClientSession) => Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>>;
  recordDeliveryPayment: (input: RecordDeliveryPaymentInput, session?: mongoose.ClientSession) => Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>>;
};

const checkIdempotency = async (
  transactionRepository: ITransactionRepository,
  source: TransactionSource,
  sourceReferenceId: Id,
  accountId: Id,
): Promise<ITransaction | null> => {
  const existingResult = await transactionRepository.getOne([
    { field: 'source', value: source, operator: '=' },
    { field: 'sourceReferenceId', value: sourceReferenceId.toString(), operator: '=' },
    { field: 'accountId', value: accountId.toString(), operator: '=' },
  ]);

  if (existingResult.isFailure) {
    return null;
  }

  return existingResult.getValue();
};

const updateAccountBalance = async (
  accountRepository: IAccountRepository,
  account: IAccount,
  amount: PositiveNumber,
  isCredit: boolean,
  session?: mongoose.ClientSession,
): Promise<Result<IAccount, DatabaseError>> => {
  const newBalance = isCredit
    ? (account.balance as number) + (amount as number)
    : (account.balance as number) - (amount as number);

  const updatedAccount = makeAccount({
    id: account.id!.toString(),
    name: account.name.toString(),
    currency: account.currency.toString(),
    balance: newBalance,
    createdAt: account.createdAt.toString(),
    updatedAt: new Date().toISOString(),
  });

  return accountRepository.updateById(account.id!, updatedAccount, IdVO.generateNil());
};

export const makeFinancialTransactionService = (
  transactionRepository: ITransactionRepository,
  accountRepository: IAccountRepository,
): FinancialTransactionService => {
  return {
    recordOrderPayment: async (input: RecordOrderPaymentInput, session?: mongoose.ClientSession): Promise<Result<ITransaction[], FinancialIntegrationError | DatabaseError>> => {
      const transactions: ITransaction[] = [];

      for (const payment of input.payments) {
        const existing = await checkIdempotency(
          transactionRepository,
          TransactionSource.ORDER_PAYMENT,
          input.orderId,
          payment.accountId,
        );

        if (existing) {
          transactions.push(existing);
          continue;
        }

        const accountResult = await accountRepository.getById(payment.accountId);
        if (accountResult.isFailure) {
          return Result.fail(accountResult.getError());
        }

        const account = accountResult.getValue() as IAccount | null;
        if (!account) {
          return Result.fail(new FinancialIntegrationError(`Account not found: ${payment.accountId}`));
        }

        const transactionResult = makeTransactionResult({
          accountId: payment.accountId.toString(),
          type: TransactionType.CREDIT,
          amount: payment.amount as number,
          currency: account.currency.toString(),
          description: `Order payment - ${input.orderId}`,
          date: new Date().toISOString(),
          financialDayId: input.financialDayId.toString(),
          source: TransactionSource.ORDER_PAYMENT,
          sourceReferenceId: input.orderId.toString(),
        });
        if (transactionResult.isFailure) return Result.fail(transactionResult.getError());
        const transaction = transactionResult.getValue();

        const updateResult = await updateAccountBalance(accountRepository, account, payment.amount, true, session);
        if (updateResult.isFailure) {
          return Result.fail(updateResult.getError());
        }

        const saveResult = await transactionRepository.create(transaction, IdVO.generateNil());
        if (saveResult.isFailure) {
          return Result.fail(saveResult.getError());
        }

        transactions.push(saveResult.getValue());
      }

      return Result.ok(transactions);
    },

    reverseOrderPayment: async (input: ReverseOrderPaymentInput, session?: mongoose.ClientSession): Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>> => {
      const existing = await checkIdempotency(
        transactionRepository,
        TransactionSource.ORDER_REFUND,
        input.orderId,
        input.accountId,
      );

      if (existing) {
        return Result.ok(existing);
      }

      const accountResult = await accountRepository.getById(input.accountId);
      if (accountResult.isFailure) {
        return Result.fail(accountResult.getError());
      }

      const account = accountResult.getValue() as IAccount | null;
      if (!account) {
        return Result.fail(new FinancialIntegrationError(`Account not found: ${input.accountId}`));
      }

      const transactionResult = makeTransactionResult({
        accountId: input.accountId.toString(),
        type: TransactionType.DEBIT,
        amount: input.amount as number,
        currency: account.currency.toString(),
        description: `Order refund - ${input.orderId}`,
        date: new Date().toISOString(),
        financialDayId: input.financialDayId.toString(),
        source: TransactionSource.ORDER_REFUND,
        sourceReferenceId: input.orderId.toString(),
      });
        if (transactionResult.isFailure) return Result.fail(transactionResult.getError());
        const transaction = transactionResult.getValue();

      const updateResult = await updateAccountBalance(accountRepository, account, input.amount, false, session);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }

      const saveResult = await transactionRepository.create(transaction, IdVO.generateNil());
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok(saveResult.getValue());
    },

    recordExpense: async (input: RecordExpenseInput, session?: mongoose.ClientSession): Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>> => {
      const existing = await checkIdempotency(
        transactionRepository,
        TransactionSource.EXPENSE,
        input.expenseId,
        input.accountId,
      );

      if (existing) {
        return Result.ok(existing);
      }

      const accountResult = await accountRepository.getById(input.accountId);
      if (accountResult.isFailure) {
        return Result.fail(accountResult.getError());
      }

      const account = accountResult.getValue() as IAccount | null;
      if (!account) {
        return Result.fail(new FinancialIntegrationError(`Account not found: ${input.accountId}`));
      }

      const transactionResult = makeTransactionResult({
        accountId: input.accountId.toString(),
        type: TransactionType.DEBIT,
        amount: input.amount as number,
        currency: account.currency.toString(),
        description: `Expense - ${input.expenseId}`,
        date: new Date().toISOString(),
        financialDayId: input.financialDayId.toString(),
        source: TransactionSource.EXPENSE,
        sourceReferenceId: input.expenseId.toString(),
      });
        if (transactionResult.isFailure) return Result.fail(transactionResult.getError());
        const transaction = transactionResult.getValue();

      const updateResult = await updateAccountBalance(accountRepository, account, input.amount, false, session);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }

      const saveResult = await transactionRepository.create(transaction, IdVO.generateNil());
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok(saveResult.getValue());
    },

    reverseExpense: async (input: ReverseExpenseInput, session?: mongoose.ClientSession): Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>> => {
      const existing = await checkIdempotency(
        transactionRepository,
        TransactionSource.EXPENSE_REVERSAL,
        input.expenseId,
        input.accountId,
      );

      if (existing) {
        return Result.ok(existing);
      }

      const accountResult = await accountRepository.getById(input.accountId);
      if (accountResult.isFailure) {
        return Result.fail(accountResult.getError());
      }

      const account = accountResult.getValue() as IAccount | null;
      if (!account) {
        return Result.fail(new FinancialIntegrationError(`Account not found: ${input.accountId}`));
      }

      const transactionResult = makeTransactionResult({
        accountId: input.accountId.toString(),
        type: TransactionType.CREDIT,
        amount: input.amount as number,
        currency: account.currency.toString(),
        description: `Expense reversal - ${input.expenseId}`,
        date: new Date().toISOString(),
        financialDayId: input.financialDayId.toString(),
        source: TransactionSource.EXPENSE_REVERSAL,
        sourceReferenceId: input.expenseId.toString(),
      });
        if (transactionResult.isFailure) return Result.fail(transactionResult.getError());
        const transaction = transactionResult.getValue();

      const updateResult = await updateAccountBalance(accountRepository, account, input.amount, true, session);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }

      const saveResult = await transactionRepository.create(transaction, IdVO.generateNil());
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok(saveResult.getValue());
    },

    recordDeliveryPayment: async (input: RecordDeliveryPaymentInput, session?: mongoose.ClientSession): Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>> => {
      const existing = await checkIdempotency(
        transactionRepository,
        TransactionSource.DELIVERY,
        input.deliveryId,
        input.accountId,
      );

      if (existing) {
        return Result.ok(existing);
      }

      const accountResult = await accountRepository.getById(input.accountId);
      if (accountResult.isFailure) {
        return Result.fail(accountResult.getError());
      }

      const account = accountResult.getValue() as IAccount | null;
      if (!account) {
        return Result.fail(new FinancialIntegrationError(`Account not found: ${input.accountId}`));
      }

      const transactionResult = makeTransactionResult({
        accountId: input.accountId.toString(),
        type: TransactionType.CREDIT,
        amount: input.amount as number,
        currency: account.currency.toString(),
        description: `Delivery ${input.deliveryId} for Order ${input.orderId}`,
        date: new Date().toISOString(),
        financialDayId: input.financialDayId.toString(),
        source: TransactionSource.DELIVERY,
        sourceReferenceId: input.deliveryId.toString(),
      });
        if (transactionResult.isFailure) return Result.fail(transactionResult.getError());
        const transaction = transactionResult.getValue();

      const updateResult = await updateAccountBalance(accountRepository, account, input.amount, true, session);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }

      const saveResult = await transactionRepository.create(transaction, IdVO.generateNil());
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok(saveResult.getValue());
    },
  };
};
