import {
  filterExpensesByContextAndDates,
  aggregateStockMetrics,
  aggregateOrderPeriodsAndTopSellers,
  mapToSortedArray,
} from "./context-metrics-helpers.js";
import { calculateTrends, calculateAccountDistribution } from "./context-metrics-trends.js";
import {
  ContextMetrics,
  ContextMetricsCalculator,
  ContextMetricsCalculatorParams,
} from "./context-metrics.types.js";

export type {
  PeriodMetric,
  TopSellerMetric,
  AccountDistribution,
  ContextMetrics,
  ContextMetricsCalculatorParams,
  ContextMetricsCalculator,
} from "./context-metrics.types.js";

export function calculateContextMetrics(
  props: ContextMetricsCalculatorParams,
): ContextMetrics {
  const { products, orders, expenses, accounts, contextId, startDate, endDate, period } =
    props;

  const { contextExpenses, totalExpenses } = filterExpensesByContextAndDates(
    expenses,
    contextId,
    startDate,
    endDate,
  );

  const {
    contextProductIds,
    productMap,
    totalStock,
    investedCapital,
    potentialRevenue,
    potentialMargin,
  } = aggregateStockMetrics(products, contextId);

  const {
    completedOrders,
    dailyMap,
    weeklyMap,
    monthlyMap,
    quarterlyMap,
    semestralMap,
    annualMap,
    topSellers,
    totalRevenue,
    totalCOGS,
  } = aggregateOrderPeriodsAndTopSellers(
    orders,
    contextProductIds,
    productMap,
    startDate,
    endDate,
  );

  const { revenueTrend, profitTrend, expenseTrend } = calculateTrends({
    period,
    contextExpenses,
    orders,
    contextProductIds,
    productMap,
  });

  const { accountDistribution, favoriteAccountName } = calculateAccountDistribution(
    completedOrders,
    contextProductIds,
    accounts,
  );

  const netProfit = totalRevenue - totalCOGS - totalExpenses;

  return {
    totalStock: Number(totalStock.toFixed(4)),
    investedCapital: Number(investedCapital.toFixed(2)),
    potentialRevenue: Number(potentialRevenue.toFixed(2)),
    potentialMargin: Number(potentialMargin.toFixed(2)),
    topSellers,
    totalExpenses: Number(totalExpenses.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    totalRevenue: Number(totalRevenue.toFixed(2)),
    periods: {
      daily: mapToSortedArray(dailyMap),
      weekly: mapToSortedArray(weeklyMap),
      monthly: mapToSortedArray(monthlyMap),
      quarterly: mapToSortedArray(quarterlyMap),
      semestral: mapToSortedArray(semestralMap),
      annual: mapToSortedArray(annualMap),
    },
    totalCOGS: Number(totalCOGS.toFixed(2)),
    revenueTrend,
    profitTrend,
    expenseTrend,
    accountDistribution,
    favoriteAccountName,
  };
}

export function makeContextMetricsCalculator(): ContextMetricsCalculator {
  return {
    calculate: calculateContextMetrics,
  };
}
