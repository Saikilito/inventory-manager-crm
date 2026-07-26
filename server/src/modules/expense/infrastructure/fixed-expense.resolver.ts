import { IContext as IApolloContext } from "../../../config/apollo.js";
import { IFixedExpense, IFixedExpensePayment } from "../../../../../shared-domain/src/expense/fixed-expense.entity.js";
import { ExpenseCategory } from "../../../../../shared-domain/src/expense/expense.entity.js";

const mapFixedExpenseToGql = (fe: IFixedExpense) => {
  return {
    id: fe.id?.toString(),
    name: fe.name.toString(),
    category: fe.category,
    amount: Number(fe.amount),
    isActive: fe.isActive,
    contextId: fe.contextId?.toString() || null,
  };
};

const mapFixedExpensePaymentToGql = (fep: IFixedExpensePayment) => {
  return {
    id: fep.id?.toString(),
    fixedExpenseId: fep.fixedExpenseId.toString(),
    billingMonth: fep.billingMonth.toString(),
    isPaid: fep.isPaid,
    amountPaid: Number(fep.amountPaid),
    paidAt: fep.paidAt?.toString() || null,
    generatedExpenseId: fep.generatedExpenseId?.toString() || null,
  };
};

export default {
  Query: {
    getFixedExpenseTemplates: async (
      _parent: unknown,
      { contextId }: { contextId?: string },
      { container }: IApolloContext
    ) => {
      const result = await container.expense.getAllFixedExpenses({ contextId });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().map(mapFixedExpenseToGql);
    },

    getFixedExpenseChecklist: async (
      _parent: unknown,
      { billingMonth, contextId }: { billingMonth: string; contextId?: string },
      { container }: IApolloContext
    ) => {
      const result = await container.expense.getFixedExpensePayments({ billingMonth, contextId });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().map(item => ({
        fixedExpense: mapFixedExpenseToGql(item.fixedExpense),
        payment: item.payment ? mapFixedExpensePaymentToGql(item.payment) : null
      }));
    }
  },

  Mutation: {
    createFixedExpenseTemplate: async (
      _parent: unknown,
      { input }: { input: { name: string; category: ExpenseCategory; amount: number; isActive?: boolean; contextId?: string } },
      { container }: IApolloContext
    ) => {
      const result = await container.expense.createFixedExpense(input);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapFixedExpenseToGql(result.getValue());
    },

    updateFixedExpenseTemplate: async (
      _parent: unknown,
      { input }: { input: { id: string; name?: string; category?: ExpenseCategory; amount?: number; isActive?: boolean; contextId?: string } },
      { container }: IApolloContext
    ) => {
      const result = await container.expense.updateFixedExpense(input);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapFixedExpenseToGql(result.getValue());
    },

    deleteFixedExpenseTemplate: async (
      _parent: unknown,
      { id }: { id: string },
      { container }: IApolloContext
    ) => {
      const result = await container.expense.deleteFixedExpense(id);
      if (result.isFailure) {
        throw result.getError();
      }
      return true;
    },

    payFixedExpense: async (
      _parent: unknown,
      { input }: { input: { fixedExpenseId: string; billingMonth: string; amountPaid: number; contextId?: string; accountId?: string } },
      { container }: IApolloContext
    ) => {
      const result = await container.expense.payFixedExpense(input);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapFixedExpensePaymentToGql(result.getValue());
    },

    unpayFixedExpense: async (
      _parent: unknown,
      { input }: { input: { fixedExpenseId: string; billingMonth: string } },
      { container }: IApolloContext
    ) => {
      const result = await container.expense.unpayFixedExpense(input);
      if (result.isFailure) {
        throw result.getError();
      }
      return true;
    }
  }
};
