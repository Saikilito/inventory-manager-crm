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
  description?: string;
}

export interface ReverseExpenseInput {
  expenseId: Id;
  amount: PositiveNumber;
  accountId: Id;
  financialDayId: Id;
  description?: string;
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
  amount: PositiveNumber | number,
  isCredit: boolean,
  _session?: mongoose.ClientSession,
): Promise<Result<IAccount, DatabaseError>> => {
  const numAmount = Number(amount);
  const newBalance = isCredit
    ? Number(account.balance) + numAmount
    : Number(account.balance) - numAmount;

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

interface ExecuteSingleTransactionParams {
  source: TransactionSource;
  sourceReferenceId: Id;
  accountId: Id;
  type: TransactionType;
  amount: PositiveNumber | number;
  financialDayId: Id;
  description: string;
  isCredit: boolean;
  session?: mongoose.ClientSession;
}

const executeSingleTransaction = async (
  transactionRepository: ITransactionRepository,
  accountRepository: IAccountRepository,
  params: ExecuteSingleTransactionParams,
): Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>> => {
  const {
    source,
    sourceReferenceId,
    accountId,
    type,
    amount,
    financialDayId,
    description,
    isCredit,
    session,
  } = params;

  const existing = await checkIdempotency(
    transactionRepository,
    source,
    sourceReferenceId,
    accountId,
  );

  if (existing) {
    return Result.ok(existing);
  }

  const accountResult = await accountRepository.getById(accountId);
  if (accountResult.isFailure) {
    return Result.fail(accountResult.getError());
  }

  const account = accountResult.getValue() as IAccount | null;
  if (!account) {
    return Result.fail(new FinancialIntegrationError(`Account not found: ${accountId}`));
  }

  const transactionResult = makeTransactionResult({
    accountId: accountId.toString(),
    type,
    amount: Number(amount),
    currency: account.currency.toString(),
    description,
    date: new Date().toISOString(),
    financialDayId: financialDayId.toString(),
    source,
    sourceReferenceId: sourceReferenceId.toString(),
  });
  if (transactionResult.isFailure) return Result.fail(transactionResult.getError());
  const transaction = transactionResult.getValue();

  const saveResult = await transactionRepository.create(transaction, IdVO.generateNil());
  if (saveResult.isFailure) {
    return Result.fail(saveResult.getError());
  }

  const updateResult = await updateAccountBalance(accountRepository, account, amount, isCredit, session);
  if (updateResult.isFailure) {
    await transactionRepository.deleteByIds([saveResult.getValue().id!], IdVO.generateNil());
    return Result.fail(updateResult.getError());
  }

  return Result.ok(saveResult.getValue());
};

export const makeFinancialTransactionService = (
  transactionRepository: ITransactionRepository,
  accountRepository: IAccountRepository,
): FinancialTransactionService => {
  return {
    recordOrderPayment: async (input: RecordOrderPaymentInput, session?: mongoose.ClientSession): Promise<Result<ITransaction[], FinancialIntegrationError | DatabaseError>> => {
      const transactions: ITransaction[] = [];

      for (const payment of input.payments) {
        const result = await executeSingleTransaction(transactionRepository, accountRepository, {
          source: TransactionSource.ORDER_PAYMENT,
          sourceReferenceId: input.orderId,
          accountId: payment.accountId,
          type: TransactionType.CREDIT,
          amount: payment.amount,
          financialDayId: input.financialDayId,
          description: `Order payment - ${input.orderId}`,
          isCredit: true,
          session,
        });

        if (result.isFailure) {
          return Result.fail(result.getError());
        }

        transactions.push(result.getValue());
      }

      return Result.ok(transactions);
    },

    reverseOrderPayment: async (input: ReverseOrderPaymentInput, session?: mongoose.ClientSession): Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>> => {
      return executeSingleTransaction(transactionRepository, accountRepository, {
        source: TransactionSource.ORDER_REFUND,
        sourceReferenceId: input.orderId,
        accountId: input.accountId,
        type: TransactionType.DEBIT,
        amount: input.amount,
        financialDayId: input.financialDayId,
        description: `Order refund - ${input.orderId}`,
        isCredit: false,
        session,
      });
    },

    recordExpense: async (input: RecordExpenseInput, session?: mongoose.ClientSession): Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>> => {
      return executeSingleTransaction(transactionRepository, accountRepository, {
        source: TransactionSource.EXPENSE,
        sourceReferenceId: input.expenseId,
        accountId: input.accountId,
        type: TransactionType.DEBIT,
        amount: input.amount,
        financialDayId: input.financialDayId,
        description: input.description || `Expense - ${input.expenseId}`,
        isCredit: false,
        session,
      });
    },

    reverseExpense: async (input: ReverseExpenseInput, session?: mongoose.ClientSession): Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>> => {
      return executeSingleTransaction(transactionRepository, accountRepository, {
        source: TransactionSource.EXPENSE_REVERSAL,
        sourceReferenceId: input.expenseId,
        accountId: input.accountId,
        type: TransactionType.CREDIT,
        amount: input.amount,
        financialDayId: input.financialDayId,
        description: input.description || `Expense reversal - ${input.expenseId}`,
        isCredit: true,
        session,
      });
    },

    recordDeliveryPayment: async (input: RecordDeliveryPaymentInput, session?: mongoose.ClientSession): Promise<Result<ITransaction, FinancialIntegrationError | DatabaseError>> => {
      return executeSingleTransaction(transactionRepository, accountRepository, {
        source: TransactionSource.DELIVERY,
        sourceReferenceId: input.deliveryId,
        accountId: input.accountId,
        type: TransactionType.CREDIT,
        amount: input.amount,
        financialDayId: input.financialDayId,
        description: `Delivery ${input.deliveryId} for Order ${input.orderId}`,
        isCredit: true,
        session,
      });
    },
  };
};
