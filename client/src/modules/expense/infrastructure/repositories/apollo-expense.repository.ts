import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { ExpenseRepository, GetExpensesResult } from '../../domain/expense.repository.js';
import { IExpense, makeExpense } from '@shared-domain/expense/expense.entity.js';
import { doTryResult } from '@shared-domain/shared/do-try-result.js';
import { createDatabaseError } from '@shared-domain/shared/errors.js';
import { GET_ALL_EXPENSES, GET_SINGLE_EXPENSE } from '../graphql/queries.js';
import { CREATE_EXPENSE, UPDATE_EXPENSE, DELETE_EXPENSE } from '../graphql/mutations.js';

interface GQLExpense {
  id: string;
  _id?: string;
  amount: number;
  description: string;
  category: string;
  contextId?: string;
  referenceId?: string;
  referenceType?: string;
  accountId?: string;
  account?: {
    id?: string;
    _id?: string;
    name: string;
    currency: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface GetAllExpensesData {
  getAllExpenses: {
    items: GQLExpense[];
    total: number;
  };
}

interface GetExpenseData {
  getExpense: GQLExpense;
}

export function makeApolloExpenseRepository(apolloClient: ApolloClient<NormalizedCacheObject>): ExpenseRepository {
  const mapGQLToDomain = (gqlExpense: GQLExpense): IExpense => {
    return makeExpense({
      id: gqlExpense.id || gqlExpense._id,
      amount: gqlExpense.amount,
      description: gqlExpense.description,
      category: gqlExpense.category,
      contextId: gqlExpense.contextId,
      referenceId: gqlExpense.referenceId,
      referenceType: gqlExpense.referenceType,
      accountId: gqlExpense.accountId,
      accountName: gqlExpense.account?.name,
      createdAt: gqlExpense.createdAt,
      updatedAt: gqlExpense.updatedAt,
    });
  };

  return {
    getAll: async (limit, offset, contextId, category) => {
      return doTryResult(
        async (): Promise<GetExpensesResult> => {
          const { data } = await apolloClient.query<GetAllExpensesData>({
            query: GET_ALL_EXPENSES,
            variables: {
              limit,
              offset,
              contextId,
              category,
            },
            fetchPolicy: 'no-cache',
          });

          return {
            items: (data.getAllExpenses?.items || []).map(mapGQLToDomain),
            total: data.getAllExpenses?.total || 0,
          };
        },
        (err) => createDatabaseError(err.message),
      );
    },

    getById: async (id) => {
      return doTryResult(
        async (): Promise<IExpense | null> => {
          const { data } = await apolloClient.query<GetExpenseData>({
            query: GET_SINGLE_EXPENSE,
            variables: { id },
            fetchPolicy: 'no-cache',
          });

          if (!data || !data.getExpense) {
            return null;
          }

          return mapGQLToDomain(data.getExpense);
        },
        (err) => createDatabaseError(err.message),
      );
    },

    create: async (expense) => {
      return doTryResult(
        async (): Promise<boolean> => {
          const { data } = await apolloClient.mutate<{ createExpense: GQLExpense }>({
            mutation: CREATE_EXPENSE,
            variables: {
              input: {
                amount: Number(expense.amount),
                description: String(expense.description),
                category: String(expense.category),
                contextId: expense.contextId ? String(expense.contextId) : undefined,
                referenceId: expense.referenceId ? String(expense.referenceId) : undefined,
                referenceType: expense.referenceType ? String(expense.referenceType) : undefined,
                accountId: expense.accountId ? String(expense.accountId) : undefined,
              },
            },
          });

          return !!data?.createExpense;
        },
        (err) => createDatabaseError(err.message),
      );
    },

    update: async (expense) => {
      return doTryResult(
        async (): Promise<boolean> => {
          const { data } = await apolloClient.mutate<{ updateExpense: GQLExpense }>({
            mutation: UPDATE_EXPENSE,
            variables: {
              input: {
                id: String(expense.id),
                amount: expense.amount ? Number(expense.amount) : undefined,
                description: expense.description ? String(expense.description) : undefined,
                category: expense.category ? String(expense.category) : undefined,
                contextId: expense.contextId ? String(expense.contextId) : undefined,
                referenceId: expense.referenceId ? String(expense.referenceId) : undefined,
                referenceType: expense.referenceType ? String(expense.referenceType) : undefined,
                accountId: expense.accountId ? String(expense.accountId) : undefined,
              },
            },
          });

          return !!data?.updateExpense;
        },
        (err) => createDatabaseError(err.message),
      );
    },

    delete: async (id) => {
      return doTryResult(
        async (): Promise<boolean> => {
          const { data } = await apolloClient.mutate<{ deleteExpense: boolean }>({
            mutation: DELETE_EXPENSE,
            variables: { id },
          });

          return data?.deleteExpense ?? false;
        },
        (err) => createDatabaseError(err.message),
      );
    },
  };
}
