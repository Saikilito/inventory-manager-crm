export interface BusinessCostMetricByPeriod {
  period: string;
  totalExpenses: number;
  daysInPeriod: number;
  costPerDay: number;
  newClients: number;
  customerAcquisitionCost: number | null;
}

export interface BusinessCostMetrics {
  daily: BusinessCostMetricByPeriod;
  weekly: BusinessCostMetricByPeriod;
  monthly: BusinessCostMetricByPeriod;
  averageCostPerDay: number;
  overallCac: number | null;
}

export interface BusinessCostMetricsCalculatorParams {
  expenses: Array<{
    amount: number;
    createdAt?: Date | string;
    contextId?: string;
  }>;
  fixedExpenses: Array<{
    amount: number;
    isActive: boolean;
    contextId?: string;
  }>;
  clients: Array<{
    createdAt?: Date | string;
    contextId?: string;
  }>;
  contextId?: string;
  referenceDate?: Date;
}

export interface BusinessCostMetricsCalculator {
  calculate(params: BusinessCostMetricsCalculatorParams): BusinessCostMetrics;
}
