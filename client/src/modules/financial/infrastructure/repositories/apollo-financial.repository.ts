import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { FinancialRepository } from '../../domain/financial.repository';
import { IAccount, makeAccount } from '@shared-domain/financial/account.entity.js';
import { ITransaction, makeTransactionResult } from '@shared-domain/financial/transaction.entity.js';
import { IFinancialDay, makeFinancialDay } from '@shared-domain/financial/financial-day.entity.js';
import { makeExchangeRate } from '@shared-domain/financial/exchange-rate.entity.js';
import { doTryResult } from '@shared-domain/shared/do-try-result';
import { createDatabaseError } from '@shared-domain/shared/errors.js';
import { GET_FINANCIAL_DAY_BY_DATE, GET_ACCOUNTS, GET_TRANSACTIONS } from '../graphql/queries';
import {
  CREATE_ACCOUNT,
  ADJUST_ACCOUNT,
  CREATE_TRANSACTION,
  UPDATE_EXCHANGE_RATE,
  OPEN_FINANCIAL_DAY,
  CLOSE_FINANCIAL_DAY,
  TRANSFER_FUNDS,
  DELETE_TRANSACTION,
} from '../graphql/mutations';

interface GQLAccount {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

interface GQLTransaction {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  financialDayId: string;
  source?: string;
  sourceReferenceId?: string;
  createdAt: string;
}

interface GQLFinancialDayBalance {
  accountId: string;
  balance: number;
}

interface GQLFinancialDay {
  id: string;
  date: string;
  status: string;
  openingBalances: GQLFinancialDayBalance[];
  closingBalances?: GQLFinancialDayBalance[];
  openedAt: string;
  closedAt?: string;
}

interface GQLFinancialDayResult {
  financialDay: GQLFinancialDay | null;
  exchangeRate: number | null;
}

export function makeApolloFinancialRepository(
  apolloClient: ApolloClient<NormalizedCacheObject>,
): FinancialRepository {
  const mapAccountToDomain = (acc: GQLAccount): IAccount => {
    return makeAccount({
      id: acc.id,
      name: acc.name,
      currency: acc.currency,
      balance: acc.balance,
    });
  };

  const mapTransactionToDomain = (tx: GQLTransaction): ITransaction => {
    const result = makeTransactionResult({
      id: tx.id,
      accountId: tx.accountId,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      description: tx.description,
      date: tx.date,
      financialDayId: tx.financialDayId,
      source: tx.source,
      sourceReferenceId: tx.sourceReferenceId,
      createdAt: tx.createdAt,
    });
    if (result.isFailure) throw new Error(result.getError()?.message);
    return result.getValue();
  };

  const mapFinancialDayToDomain = (fd: GQLFinancialDay): IFinancialDay => {
    return makeFinancialDay({
      id: fd.id,
      date: fd.date,
      status: fd.status,
      openingBalances: fd.openingBalances.map((b) => ({
        accountId: b.accountId,
        balance: b.balance,
      })),
      closingBalances: (fd.closingBalances || []).map((b) => ({
        accountId: b.accountId,
        balance: b.balance,
      })),
      openedAt: fd.openedAt,
      closedAt: fd.closedAt,
    });
  };

  return {
    getFinancialDayByDate: async (date: string) => {
      return doTryResult(
        async () => {
          const { data } = await apolloClient.query<{ getFinancialDayByDate: GQLFinancialDayResult }>({
            query: GET_FINANCIAL_DAY_BY_DATE,
            variables: { date },
            fetchPolicy: 'no-cache',
          });

          const result = data.getFinancialDayByDate;
          return {
            day: result.financialDay ? mapFinancialDayToDomain(result.financialDay) : null,
            rate: result.exchangeRate,
          };
        },
        (err) => createDatabaseError(err.message),
      );
    },

    getAccounts: async () => {
      return doTryResult(
        async () => {
          const { data } = await apolloClient.query<{ getAccounts: GQLAccount[] }>({
            query: GET_ACCOUNTS,
            fetchPolicy: 'no-cache',
          });

          return (data.getAccounts || []).map(mapAccountToDomain);
        },
        (err) => createDatabaseError(err.message),
      );
    },

    getTransactions: async (accountId: string) => {
      return doTryResult(
        async () => {
          const { data } = await apolloClient.query<{ getTransactions: GQLTransaction[] }>({
            query: GET_TRANSACTIONS,
            variables: { accountId },
            fetchPolicy: 'no-cache',
          });

          return (data.getTransactions || []).map(mapTransactionToDomain);
        },
        (err) => createDatabaseError(err.message),
      );
    },

    createAccount: async (name, currency, balance) => {
      return doTryResult(
        async () => {
          const { data } = await apolloClient.mutate<{ createAccount: GQLAccount }>({
            mutation: CREATE_ACCOUNT,
            variables: { name, currency, balance },
          });

          if (!data || !data.createAccount) {
            throw new Error('Failed to create account');
          }

          return mapAccountToDomain(data.createAccount);
        },
        (err) => createDatabaseError(err.message),
      );
    },

    adjustAccount: async (input) => {
      return doTryResult(
        async () => {
          const { data } = await apolloClient.mutate<{ adjustAccount: GQLAccount }>({
            mutation: ADJUST_ACCOUNT,
            variables: input,
          });

          if (!data || !data.adjustAccount) {
            throw new Error('Failed to adjust account');
          }

          return mapAccountToDomain(data.adjustAccount);
        },
        (err) => createDatabaseError(err.message),
      );
    },

    createTransaction: async (input) => {
      return doTryResult(
        async () => {
          const { data } = await apolloClient.mutate<{ createTransaction: GQLTransaction }>({
            mutation: CREATE_TRANSACTION,
            variables: input,
          });

          if (!data || !data.createTransaction) {
            throw new Error('Failed to create transaction');
          }

          return mapTransactionToDomain(data.createTransaction);
        },
        (err) => createDatabaseError(err.message),
      );
    },

    updateExchangeRate: async (date, rate) => {
      return doTryResult(
        async () => {
          const { data } = await apolloClient.mutate<{ updateExchangeRate: { id: string; date: string; rate: number } }>({
            mutation: UPDATE_EXCHANGE_RATE,
            variables: { date, rate },
          });

          if (!data || !data.updateExchangeRate) {
            throw new Error('Failed to update exchange rate');
          }

          return makeExchangeRate({
            id: data.updateExchangeRate.id,
            date: data.updateExchangeRate.date,
            rate: data.updateExchangeRate.rate,
          });
        },
        (err) => createDatabaseError(err.message),
      );
    },

    openFinancialDay: async (date) => {
      return doTryResult(
        async () => {
          const { data } = await apolloClient.mutate<{ openFinancialDay: GQLFinancialDay }>({
            mutation: OPEN_FINANCIAL_DAY,
            variables: { date },
          });

          if (!data || !data.openFinancialDay) {
            throw new Error('Failed to open financial day');
          }

          return mapFinancialDayToDomain(data.openFinancialDay);
        },
        (err) => createDatabaseError(err.message),
      );
    },

    closeFinancialDay: async (date) => {
      return doTryResult(
        async () => {
          const { data } = await apolloClient.mutate<{ closeFinancialDay: GQLFinancialDay }>({
            mutation: CLOSE_FINANCIAL_DAY,
            variables: { date },
          });

          if (!data || !data.closeFinancialDay) {
            throw new Error('Failed to close financial day');
          }

          return mapFinancialDayToDomain(data.closeFinancialDay);
        },
        (err) => createDatabaseError(err.message),
      );
    },

    transferFunds: async (input) => {
      return doTryResult(
        async () => {
          const { data } = await apolloClient.mutate<{ transferFunds: boolean }>({
            mutation: TRANSFER_FUNDS,
            variables: input,
          });

          if (!data || data.transferFunds === undefined) {
            throw new Error('Failed to transfer funds');
          }

          return data.transferFunds;
        },
        (err) => createDatabaseError(err.message),
      );
    },

    deleteTransaction: async (id: string) => {
      return doTryResult(
        async () => {
          const { data } = await apolloClient.mutate<{ deleteTransaction: boolean }>({
            mutation: DELETE_TRANSACTION,
            variables: { id },
          });

          if (!data || data.deleteTransaction === undefined) {
            throw new Error('Failed to delete transaction');
          }

          return data.deleteTransaction;
        },
        (err) => createDatabaseError(err.message),
      );
    },
  };
}
