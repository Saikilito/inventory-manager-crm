import {
  BusinessCostMetrics,
  BusinessCostMetricByPeriod,
  BusinessCostMetricsCalculatorParams,
  BusinessCostMetricsCalculator,
} from './business-cost-metrics.types.js';

export type {
  BusinessCostMetrics,
  BusinessCostMetricByPeriod,
  BusinessCostMetricsCalculatorParams,
  BusinessCostMetricsCalculator,
} from './business-cost-metrics.types.js';

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getEndOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function filterByContext<T extends { contextId?: string }>(
  items: T[],
  contextId?: string,
): T[] {
  if (!contextId) return items;
  return items.filter((item) => !item.contextId || item.contextId === contextId);
}

function filterExpensesByPeriod(
  expenses: Array<{ amount: number; createdAt?: Date | string }>,
  startDate: Date,
  endDate: Date,
): number {
  return expenses.reduce((sum, expense) => {
    if (!expense.createdAt) return sum;
    const expenseDate = new Date(expense.createdAt);
    if (expenseDate >= startDate && expenseDate <= endDate) {
      return sum + expense.amount;
    }
    return sum;
  }, 0);
}

function filterClientsByPeriod(
  clients: Array<{ createdAt?: Date | string }>,
  startDate: Date,
  endDate: Date,
): number {
  return clients.filter((client) => {
    if (!client.createdAt) return false;
    const clientDate = new Date(client.createdAt);
    return clientDate >= startDate && clientDate <= endDate;
  }).length;
}

function calculatePeriodMetric(
  expenses: Array<{ amount: number; createdAt?: Date | string }>,
  clients: Array<{ createdAt?: Date | string }>,
  startDate: Date,
  endDate: Date,
  daysInPeriod: number,
  periodLabel: string,
): BusinessCostMetricByPeriod {
  const totalExpenses = filterExpensesByPeriod(expenses, startDate, endDate);
  const costPerDay = daysInPeriod > 0 ? totalExpenses / daysInPeriod : 0;
  const newClients = filterClientsByPeriod(clients, startDate, endDate);
  const customerAcquisitionCost = newClients > 0 ? totalExpenses / newClients : null;

  return {
    period: periodLabel,
    totalExpenses,
    daysInPeriod,
    costPerDay,
    newClients,
    customerAcquisitionCost,
  };
}

export function calculateBusinessCostMetrics(
  params: BusinessCostMetricsCalculatorParams,
): BusinessCostMetrics {
  const { expenses, fixedExpenses, clients, contextId, referenceDate = new Date() } = params;

  const refDate = new Date(referenceDate);

  const filteredExpenses = filterByContext(expenses, contextId);
  const filteredFixedExpenses = filterByContext(fixedExpenses, contextId);
  const filteredClients = filterByContext(clients, contextId);

  const activeFixedExpenses = filteredFixedExpenses.filter((fe) => fe.isActive);
  const monthlyFixedExpensesTotal = activeFixedExpenses.reduce((sum, fe) => sum + fe.amount, 0);
  const dailyFixedExpenses = monthlyFixedExpensesTotal / 30;

  const todayStart = getStartOfDay(refDate);
  const todayEnd = getEndOfDay(refDate);

  const weekStart = getStartOfWeek(refDate);
  const weekEnd = getEndOfWeek(refDate);

  const monthStart = getStartOfMonth(refDate);
  const monthEnd = getEndOfMonth(refDate);

  const todayVarExpenses = filterExpensesByPeriod(filteredExpenses, todayStart, todayEnd);
  const weekVarExpenses = filterExpensesByPeriod(filteredExpenses, weekStart, weekEnd);
  const monthVarExpenses = filterExpensesByPeriod(filteredExpenses, monthStart, monthEnd);

  const todayTotalExpenses = todayVarExpenses + dailyFixedExpenses;
  const weekTotalExpenses = weekVarExpenses + dailyFixedExpenses * 7;
  const monthTotalExpenses = monthVarExpenses + monthlyFixedExpensesTotal;

  const todayNewClients = filterClientsByPeriod(filteredClients, todayStart, todayEnd);
  const weekNewClients = filterClientsByPeriod(filteredClients, weekStart, weekEnd);
  const monthNewClients = filterClientsByPeriod(filteredClients, monthStart, monthEnd);

  const todayLabel = refDate.toISOString().split('T')[0];
  const weekLabel = `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`;
  const monthLabel = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`;

  const daily: BusinessCostMetricByPeriod = {
    period: todayLabel,
    totalExpenses: todayTotalExpenses,
    daysInPeriod: 1,
    costPerDay: todayTotalExpenses,
    newClients: todayNewClients,
    customerAcquisitionCost: todayNewClients > 0 ? todayTotalExpenses / todayNewClients : null,
  };

  const weekly: BusinessCostMetricByPeriod = {
    period: weekLabel,
    totalExpenses: weekTotalExpenses,
    daysInPeriod: 7,
    costPerDay: weekTotalExpenses / 7,
    newClients: weekNewClients,
    customerAcquisitionCost: weekNewClients > 0 ? weekTotalExpenses / weekNewClients : null,
  };

  const daysInMonth = getDaysInMonth(refDate);
  const daysPassedInMonth = Math.min(refDate.getDate(), daysInMonth);

  const monthly: BusinessCostMetricByPeriod = {
    period: monthLabel,
    totalExpenses: monthTotalExpenses,
    daysInPeriod: daysPassedInMonth,
    costPerDay: daysPassedInMonth > 0 ? monthTotalExpenses / daysPassedInMonth : 0,
    newClients: monthNewClients,
    customerAcquisitionCost: monthNewClients > 0 ? monthTotalExpenses / monthNewClients : null,
  };

  const totalNewClients = todayNewClients + weekNewClients + monthNewClients;
  const totalAllExpenses = todayTotalExpenses + weekTotalExpenses + monthTotalExpenses;
  const averageCostPerDay = (daily.costPerDay + weekly.costPerDay + monthly.costPerDay) / 3;
  const overallCac = monthNewClients > 0 ? monthTotalExpenses / monthNewClients : null;

  return {
    daily,
    weekly,
    monthly,
    averageCostPerDay,
    overallCac,
  };
}

export function makeBusinessCostMetricsCalculator(): BusinessCostMetricsCalculator {
  return {
    calculate: calculateBusinessCostMetrics,
  };
}
