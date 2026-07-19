import { IContext as IContextApollo } from "../../../config/apollo.js";
import { IContext } from "../../../../../shared-domain/src/context/context.entity.js";

const mapToGql = (context: IContext) => {
  return {
    _id: context.id,
    name: context.name,
    attributes: context.attributes.map((attr) => ({
      name: attr.name,
      label: attr.label,
      type: attr.type,
      required: attr.required,
    })),
  };
};

export default {
  Query: {
    getContext: async (
      _parent: unknown,
      { _id }: { _id: string },
      { container }: IContextApollo,
    ) => {
      const result = await container.context.getContext(_id);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    getAllContexts: async (
      _parent: unknown,
      _args: unknown,
      { container }: IContextApollo,
    ) => {
      const result = await container.context.getAllContexts({});
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().map(mapToGql);
    },

    getContextMetrics: async (
      _parent: unknown,
      {
        contextId,
        period,
        startDate,
        endDate,
      }: {
        contextId?: string;
        period?: string;
        startDate?: string;
        endDate?: string;
      },
      { container }: IContextApollo,
    ) => {
      const result = await container.context.getContextMetrics({
        contextId,
        period,
        startDate,
        endDate,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      const metrics = result.getValue();
      return {
        totalStock: metrics.totalStock,
        investedCapital: metrics.investedCapital,
        projectedGrossMargin: metrics.potentialMargin,
        topSellers: metrics.topSellers,
        totalExpenses: metrics.totalExpenses,
        netProfit: metrics.netProfit,
        totalRevenue: metrics.totalRevenue,
        periods: metrics.periods,
        totalCOGS: metrics.totalCOGS,
        revenueTrend: metrics.revenueTrend,
        profitTrend: metrics.profitTrend,
        expenseTrend: metrics.expenseTrend,
        accountDistribution: metrics.accountDistribution,
        favoriteAccountName: metrics.favoriteAccountName,
      };
    },

    getContextReport: async (
      _parent: unknown,
      { contextId, periodType }: { contextId?: string; periodType: string },
      { container }: IContextApollo,
    ) => {
      const result = await container.context.generatePdfReport({
        contextId,
        periodType,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue();
    },
  },

  Mutation: {
    createContext: async (
      _parent: unknown,
      {
        input,
      }: {
        input: {
          name: string;
          attributes: Array<{
            name: string;
            label?: string;
            type: "STRING" | "NUMBER" | "BOOLEAN";
            required: boolean;
          }>;
        };
      },
      { container }: IContextApollo,
    ) => {
      const result = await container.context.createContext({
        name: input.name,
        attributes: input.attributes,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    updateContext: async (
      _parent: unknown,
      {
        input,
      }: {
        input: {
          _id: string;
          name?: string;
          attributes?: Array<{
            name: string;
            label?: string;
            type: "STRING" | "NUMBER" | "BOOLEAN";
            required: boolean;
          }>;
        };
      },
      { container }: IContextApollo,
    ) => {
      const result = await container.context.updateContext(input);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    deleteContext: async (
      _parent: unknown,
      { _id }: { _id: string },
      { container }: IContextApollo,
    ) => {
      const result = await container.context.deleteContext(_id);
      if (result.isFailure) {
        throw result.getError();
      }
      return true;
    },
  },
};
