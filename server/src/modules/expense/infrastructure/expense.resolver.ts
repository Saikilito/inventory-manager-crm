import { IContext as IApolloContext } from "../../../config/apollo.js";
import { IExpense, ExpenseCategory, ExpenseReferenceType } from "../../../../../shared-domain/src/expense/expense.entity.js";

const mapToGql = (expense: IExpense) => {
  return {
    id: expense.id?.toString(),
    _id: expense.id?.toString(),
    amount: Number(expense.amount),
    description: expense.description?.toString(),
    category: expense.category,
    contextId: expense.contextId?.toString() || null,
    referenceId: expense.referenceId?.toString() || null,
    referenceType: expense.referenceType || null,
    createdAt: expense.createdAt?.toString() || null,
    updatedAt: expense.updatedAt?.toString() || null,
  };
};

export default {
  Query: {
    getExpense: async (
      _parent: unknown,
      { _id }: { _id: string },
      { container }: IApolloContext,
    ) => {
      const result = await container.expense.getExpense(_id);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    getAllExpenses: async (
      _parent: unknown,
      { limit, offset, contextId, category }: { limit?: number; offset?: number; contextId?: string; category?: string },
      { container }: IApolloContext,
    ) => {
      const result = await container.expense.getAllExpenses({
        limit,
        offset,
        contextId,
        category,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      const val = result.getValue();
      return {
        items: val.items.map(mapToGql),
        total: val.total,
      };
    },
  },

  Mutation: {
    createExpense: async (
      _parent: unknown,
      {
        input,
      }: {
        input: {
          amount: number;
          description: string;
          category: ExpenseCategory;
          contextId?: string;
          referenceId?: string;
          referenceType?: ExpenseReferenceType;
        };
      },
      { container }: IApolloContext,
    ) => {
      const result = await container.expense.createExpense(input);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    updateExpense: async (
      _parent: unknown,
      {
        input,
      }: {
        input: {
          id: string;
          amount?: number;
          description?: string;
          category?: ExpenseCategory;
          contextId?: string;
          referenceId?: string;
          referenceType?: ExpenseReferenceType;
        };
      },
      { container }: IApolloContext,
    ) => {
      const result = await container.expense.updateExpense(input);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    deleteExpense: async (
      _parent: unknown,
      { _id }: { _id: string },
      { container }: IApolloContext,
    ) => {
      const result = await container.expense.deleteExpense(_id);
      if (result.isFailure) {
        throw result.getError();
      }
      return true;
    },
  },
};
