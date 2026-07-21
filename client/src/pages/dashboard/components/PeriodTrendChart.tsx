import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_CONTEXT_METRICS } from '@modules/product/infrastructure/graphql/queries';
import { formatCurrency } from '@utils/formatters';

interface PeriodMetric {
  period: string;
  revenue: number;
  profit: number;
  salesCount: number;
}

interface PeriodTrendChartProps {
  contextId?: string;
  selectedPeriod: string;
}

export const PeriodTrendChart: React.FC<PeriodTrendChartProps> = ({
  contextId,
  selectedPeriod,
}) => {
  const { data, loading } = useQuery(GET_CONTEXT_METRICS, {
    variables: {
      contextId,
      period: selectedPeriod,
    },
    fetchPolicy: 'cache-first',
  });

  const metrics = data?.getContextMetrics;

  // Get the right period array based on selectedPeriod
  const getPeriodsData = (): PeriodMetric[] => {
    if (!metrics?.periods) return [];
    
    switch (selectedPeriod) {
      case 'DAILY':
        return metrics.periods.daily || [];
      case 'WEEKLY':
        return metrics.periods.weekly || [];
      case 'MONTHLY':
        return metrics.periods.monthly || [];
      default:
        return metrics.periods.monthly || [];
    }
  };

  const periods = getPeriodsData();
  const last6Periods = periods.slice(-6);

  const netProfit = metrics?.netProfit || 0;
  const profitTrend = metrics?.profitTrend;
  const totalRevenue = metrics?.totalRevenue || 0;

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'DAILY':
        return 'días';
      case 'WEEKLY':
        return 'semanas';
      default:
        return 'meses';
    }
  };

  const formatPeriodName = (period: string, periodType: string) => {
    // Period comes as "2024-01" or "2024-W01" or "2024-01-15"
    try {
      if (periodType === 'DAILY') {
        const date = new Date(period);
        return date.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' });
      } else if (periodType === 'WEEKLY') {
        // Format: "2024-W01"
        return period.replace('W', 'Sem ');
      } else {
        // Monthly: "2024-01"
        const [year, month] = period.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('es-DO', { month: 'short', year: '2-digit' });
      }
    } catch {
      return period;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded w-48 mb-4" />
        <div className="h-40 bg-stone-100 dark:bg-stone-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">
            Tendencia - Últimos 6 {getPeriodLabel(selectedPeriod)}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Comparativa de tu ganancia neta
          </p>
        </div>
        {profitTrend !== null && profitTrend !== undefined && (
          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold ${
              profitTrend >= 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {profitTrend >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {profitTrend >= 0 ? '+' : ''}
            {profitTrend.toFixed(1)}% vs {getPeriodLabel(selectedPeriod).slice(0, -1)} anterior
          </div>
        )}
      </div>

      {last6Periods.length > 1 ? (
        <>
          {/* Bar Chart */}
          <div className="h-48 flex items-end gap-2">
            {last6Periods.map((p, i) => {
              const maxProfit = Math.max(...last6Periods.map((x) => x.profit));
              const height = maxProfit > 0 ? (p.profit / maxProfit) * 100 : 0;
              const isPositive = p.profit >= 0;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full text-center mb-1">
                    <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400">
                      {formatCurrency(p.profit)}
                    </span>
                  </div>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isPositive
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-rose-500 hover:bg-rose-600'
                    }`}
                    style={{ height: `${Math.max(Math.abs(height), 4)}%` }}
                  />
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 truncate w-full text-center">
                    {formatPeriodName(p.period, selectedPeriod)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Período actual</p>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-50 font-mono">
                {formatCurrency(netProfit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Promedio 6 {getPeriodLabel(selectedPeriod)}</p>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-50 font-mono">
                {formatCurrency(
                  last6Periods.reduce((sum, p) => sum + p.profit, 0) / last6Periods.length
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Ventas</p>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-50 font-mono">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="h-48 flex items-center justify-center bg-stone-50 dark:bg-stone-950/40 rounded-xl">
          <div className="text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Ganancia actual: <strong className="text-stone-700 dark:text-stone-300">{formatCurrency(netProfit)}</strong>
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              Necesitas más historial para ver la tendencia
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
