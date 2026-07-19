import { IProduct } from "../../../../../../shared-domain/src/product/product.entity.js";
import { IOrder } from "../../../../../../shared-domain/src/order/order.entity.js";
import { IExpense } from "../../../../../../shared-domain/src/expense/expense.entity.js";
import { IAccount } from "../../../../../../shared-domain/src/financial/account.entity.js";

export interface PeriodMetric {
  period: string;
  revenue: number;
  profit: number;
  salesCount: number;
}

export interface TopSellerMetric {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

export interface AccountDistribution {
  accountId: string;
  accountName: string;
  currency: string;
  totalReceivedUsd: number;
  percentage: number;
}

export interface ContextMetrics {
  totalStock: number;
  investedCapital: number;
  potentialRevenue: number;
  potentialMargin: number;
  topSellers: TopSellerMetric[];
  totalExpenses: number;
  netProfit: number;
  totalRevenue: number;
  periods: {
    daily: PeriodMetric[];
    weekly: PeriodMetric[];
    monthly: PeriodMetric[];
    quarterly: PeriodMetric[];
    semestral: PeriodMetric[];
    annual: PeriodMetric[];
  };
  totalCOGS: number;
  revenueTrend: number | null;
  profitTrend: number | null;
  expenseTrend: number | null;
  accountDistribution: AccountDistribution[];
  favoriteAccountName: string | null;
}

export interface ContextMetricsCalculatorParams {
  products: IProduct[];
  orders: IOrder[];
  expenses: IExpense[];
  accounts: IAccount[];
  contextId?: string;
  startDate?: string;
  endDate?: string;
  period?: string;
}

export interface ContextMetricsCalculator {
  calculate(params: ContextMetricsCalculatorParams): ContextMetrics;
}
