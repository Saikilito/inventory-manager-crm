import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';

export interface MetricsData {
  getContextMetrics?: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
}

interface ExpenseStatsProps {
  selectedPeriod: string;
  loadingMetrics: boolean;
  metricsData?: MetricsData;
}

export const ExpenseStats: React.FC<ExpenseStatsProps> = ({
  selectedPeriod,
  loadingMetrics,
  metricsData,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {/* Revenue Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Revenue ({selectedPeriod})
          </span>
          <h4 className="text-xl font-extrabold text-stone-900 dark:text-stone-50 mt-1">
            {loadingMetrics ? (
              <span className="inline-block w-16 h-5 bg-stone-100 dark:bg-stone-800 animate-pulse rounded" />
            ) : (
              formatCurrency(metricsData?.getContextMetrics?.totalRevenue || 0)
            )}
          </h4>
        </div>
        <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      {/* Expenses Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Expenses ({selectedPeriod})
          </span>
          <h4 className="text-xl font-extrabold text-stone-900 dark:text-stone-50 mt-1">
            {loadingMetrics ? (
              <span className="inline-block w-16 h-5 bg-stone-100 dark:bg-stone-800 animate-pulse rounded" />
            ) : (
              formatCurrency(metricsData?.getContextMetrics?.totalExpenses || 0)
            )}
          </h4>
        </div>
        <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
          <TrendingDown className="w-5 h-5" />
        </div>
      </div>

      {/* Net Profit Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Net Profit ({selectedPeriod})
          </span>
          <h4 className={`text-xl font-extrabold mt-1 ${
            loadingMetrics ? '' : ((metricsData?.getContextMetrics?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')
          }`}>
            {loadingMetrics ? (
              <span className="inline-block w-16 h-5 bg-stone-100 dark:bg-stone-800 animate-pulse rounded" />
            ) : (
              formatCurrency(metricsData?.getContextMetrics?.netProfit || 0)
            )}
          </h4>
        </div>
        <div className={`p-2.5 rounded-lg ${
          loadingMetrics ? 'bg-stone-100 text-stone-400 dark:bg-stone-800' : ((metricsData?.getContextMetrics?.netProfit || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400')
        }`}>
          <DollarSign className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
