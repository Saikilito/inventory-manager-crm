import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { FixedExpenseRepository, FixedExpenseChecklistItem } from '../../domain/fixed-expense.repository.js';
import {
  IFixedExpense,
  IFixedExpensePayment,
  makeFixedExpense,
  makeFixedExpensePayment,
} from '@shared-domain/expense/fixed-expense.entity.js';
import { doTryResult } from '@shared-domain/shared/do-try-result.js';
import { createDatabaseError } from '@shared-domain/shared/errors.js';

import {
  GET_FIXED_EXPENSE_TEMPLATES,
  GET_FIXED_EXPENSE_CHECKLIST,
  CREATE_FIXED_EXPENSE_TEMPLATE,
  UPDATE_FIXED_EXPENSE_TEMPLATE,
  DELETE_FIXED_EXPENSE_TEMPLATE,
  PAY_FIXED_EXPENSE,
  UNPAY_FIXED_EXPENSE,
} from '../graphql/fixed-expense.js';

interface GQLFixedExpense {
  id: string;
  name: string;
  category: string;
  amount: number;
  isActive: boolean;
  contextId?: string;
}

interface GQLFixedExpensePayment {
  id: string;
  fixedExpenseId: string;
  billingMonth: string;
  isPaid: boolean;
  amountPaid: number;
  paidAt?: string;
  generatedExpenseId?: string;
}

interface GQLChecklistItem {
  fixedExpense: GQLFixedExpense;
  payment: GQLFixedExpensePayment | null;
}

export function makeApolloFixedExpenseRepository(
  apolloClient: ApolloClient<NormalizedCacheObject>,
): FixedExpenseRepository {
  const mapTemplateGQLToDomain = (gqlFE: GQLFixedExpense): IFixedExpense => {
    return makeFixedExpense({
      id: gqlFE.id,
      name: gqlFE.name,
      category: gqlFE.category,
      amount: gqlFE.amount,
      isActive: gqlFE.isActive,
      contextId: gqlFE.contextId,
    });
  };

  const mapPaymentGQLToDomain = (gqlFEP: GQLFixedExpensePayment): IFixedExpensePayment => {
    return makeFixedExpensePayment({
      id: gqlFEP.id,
      fixedExpenseId: gqlFEP.fixedExpenseId,
      billingMonth: gqlFEP.billingMonth,
      isPaid: gqlFEP.isPaid,
      amountPaid: gqlFEP.amountPaid,
      paidAt: gqlFEP.paidAt,
      generatedExpenseId: gqlFEP.generatedExpenseId,
    });
  };

  return {
    getTemplates: async (contextId) => {
      return doTryResult(
        async (): Promise<IFixedExpense[]> => {
          const { data } = await apolloClient.query<{ getFixedExpenseTemplates: GQLFixedExpense[] }>({
            query: GET_FIXED_EXPENSE_TEMPLATES,
            variables: { contextId: contextId ? String(contextId) : undefined },
            fetchPolicy: 'no-cache',
          });

          return (data.getFixedExpenseTemplates || []).map(mapTemplateGQLToDomain);
        },
        (err) => createDatabaseError(err.message),
      );
    },

    getChecklist: async (billingMonth, contextId) => {
      return doTryResult(
        async (): Promise<FixedExpenseChecklistItem[]> => {
          const { data } = await apolloClient.query<{ getFixedExpenseChecklist: GQLChecklistItem[] }>({
            query: GET_FIXED_EXPENSE_CHECKLIST,
            variables: { billingMonth, contextId: contextId ? String(contextId) : undefined },
            fetchPolicy: 'no-cache',
          });

          return (data.getFixedExpenseChecklist || []).map((item) => ({
            fixedExpense: mapTemplateGQLToDomain(item.fixedExpense),
            payment: item.payment ? mapPaymentGQLToDomain(item.payment) : null,
          }));
        },
        (err) => createDatabaseError(err.message),
      );
    },

    createTemplate: async (fe) => {
      return doTryResult(
        async (): Promise<IFixedExpense> => {
          const { data } = await apolloClient.mutate<{ createFixedExpenseTemplate: GQLFixedExpense }>({
            mutation: CREATE_FIXED_EXPENSE_TEMPLATE,
            variables: {
              input: {
                name: String(fe.name),
                category: String(fe.category),
                amount: Number(fe.amount),
                isActive: fe.isActive,
                contextId: fe.contextId ? String(fe.contextId) : undefined,
              },
            },
          });

          if (!data?.createFixedExpenseTemplate) {
            throw new Error('Failed to create fixed expense template');
          }

          return mapTemplateGQLToDomain(data.createFixedExpenseTemplate);
        },
        (err) => createDatabaseError(err.message),
      );
    },

    updateTemplate: async (fe) => {
      return doTryResult(
        async (): Promise<IFixedExpense> => {
          const { data } = await apolloClient.mutate<{ updateFixedExpenseTemplate: GQLFixedExpense }>({
            mutation: UPDATE_FIXED_EXPENSE_TEMPLATE,
            variables: {
              input: {
                id: String(fe.id),
                name: fe.name ? String(fe.name) : undefined,
                category: fe.category ? String(fe.category) : undefined,
                amount: fe.amount ? Number(fe.amount) : undefined,
                isActive: fe.isActive,
                contextId: fe.contextId ? String(fe.contextId) : undefined,
              },
            },
          });

          if (!data?.updateFixedExpenseTemplate) {
            throw new Error('Failed to update fixed expense template');
          }

          return mapTemplateGQLToDomain(data.updateFixedExpenseTemplate);
        },
        (err) => createDatabaseError(err.message),
      );
    },

    deleteTemplate: async (id) => {
      return doTryResult(
        async (): Promise<boolean> => {
          const { data } = await apolloClient.mutate<{ deleteFixedExpenseTemplate: boolean }>({
            mutation: DELETE_FIXED_EXPENSE_TEMPLATE,
            variables: { id: String(id) },
          });

          return data?.deleteFixedExpenseTemplate ?? false;
        },
        (err) => createDatabaseError(err.message),
      );
    },

    payFixedExpense: async (fixedExpenseId, billingMonth, amountPaid, contextId) => {
      return doTryResult(
        async (): Promise<IFixedExpensePayment> => {
          const { data } = await apolloClient.mutate<{ payFixedExpense: GQLFixedExpensePayment }>({
            mutation: PAY_FIXED_EXPENSE,
            variables: {
              input: {
                fixedExpenseId: String(fixedExpenseId),
                billingMonth,
                amountPaid,
                contextId: contextId ? String(contextId) : undefined,
              },
            },
          });

          if (!data?.payFixedExpense) {
            throw new Error('Failed to pay fixed expense');
          }

          return mapPaymentGQLToDomain(data.payFixedExpense);
        },
        (err) => createDatabaseError(err.message),
      );
    },

    unpayFixedExpense: async (fixedExpenseId, billingMonth) => {
      return doTryResult(
        async (): Promise<boolean> => {
          const { data } = await apolloClient.mutate<{ unpayFixedExpense: boolean }>({
            mutation: UNPAY_FIXED_EXPENSE,
            variables: {
              input: {
                fixedExpenseId: String(fixedExpenseId),
                billingMonth,
              },
            },
          });

          return data?.unpayFixedExpense ?? false;
        },
        (err) => createDatabaseError(err.message),
      );
    },
  };
}
