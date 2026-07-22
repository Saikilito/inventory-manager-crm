import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Calendar, TrendingUp, Users, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { GET_BUSINESS_COST_METRICS } from '@modules/context/infrastructure/graphql/business-cost-queries';
import { formatCurrency } from '@utils/formatters';

type PeriodType = 'daily' | 'weekly' | 'monthly';

interface BusinessCostMetricByPeriod {
  period: string;
  totalExpenses: number;
  daysInPeriod: number;
  costPerDay: number;
  newClients: number;
  customerAcquisitionCost: number | null;
}

interface BusinessCostMetricsData {
  getBusinessCostMetrics: {
    daily: BusinessCostMetricByPeriod;
    weekly: BusinessCostMetricByPeriod;
    monthly: BusinessCostMetricByPeriod;
    averageCostPerDay: number;
    overallCac: number | null;
  };
}

const periodLabels: Record<PeriodType, string> = {
  daily: 'Hoy',
  weekly: 'Semana',
  monthly: 'Mes',
};

export const BusinessCostCard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');
  const [isExpanded, setIsExpanded] = useState(true);

  const { data, loading, error } = useQuery<BusinessCostMetricsData>(GET_BUSINESS_COST_METRICS, {
    variables: { contextId: null },
    fetchPolicy: 'cache-and-network',
  });

  const toggleExpand = () => setIsExpanded(!isExpanded);

  if (loading) {
    return (
      <div className="col-span-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-stone-200 dark:bg-stone-800 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-32" />
              <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-stone-200 dark:bg-stone-800 rounded-lg" />
            <div className="h-20 bg-stone-200 dark:bg-stone-800 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="col-span-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5">
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          No se pudieron cargar las métricas
        </p>
      </div>
    );
  }

  const metrics = data.getBusinessCostMetrics;
  const currentMetric = metrics[selectedPeriod];

  return (
    <div className="col-span-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={toggleExpand}
        className="w-full p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors duration-150"
        aria-expanded={isExpanded}
        aria-controls="business-cost-content"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-lg">
            <DollarSign className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50">
              Costo de Negocio
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Costo diario y adquisición de clientes
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-stone-400 dark:text-stone-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-stone-400 dark:text-stone-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div id="business-cost-content" className="px-5 pb-5 space-y-4">
          {/* Period Selector */}
          <div className="flex gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
            {(Object.keys(periodLabels) as PeriodType[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                  selectedPeriod === period
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {periodLabels[period]}
              </button>
            ))}
          </div>

          {/* Main Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {/* Cost Per Day */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                  Costo por día
                </span>
              </div>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 font-mono tracking-tight">
                {formatCurrency(currentMetric.costPerDay)}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                {currentMetric.daysInPeriod} {currentMetric.daysInPeriod === 1 ? 'día' : 'días'}
              </p>
            </div>

            {/* Total Expenses */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                  Gastos
                </span>
              </div>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 font-mono tracking-tight">
                {formatCurrency(currentMetric.totalExpenses)}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                {periodLabels[selectedPeriod]}
              </p>
            </div>
          </div>

          {/* CAC */}
          <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center bg-stone-200 dark:bg-stone-700 rounded-lg">
                  <Users className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    CAC
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Costo de adquisición
                  </p>
                </div>
              </div>
              <div className="text-right">
                {currentMetric.customerAcquisitionCost !== null ? (
                  <>
                    <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 font-mono tracking-tight">
                      {formatCurrency(currentMetric.customerAcquisitionCost)}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      por cliente
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-stone-400 dark:text-stone-500">
                    Sin clientes nuevos
                  </p>
                )}
              </div>
            </div>

            {/* CAC Context */}
            <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
              <span className="text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-stone-700 dark:text-stone-300">{currentMetric.newClients}</span> clientes nuevos
              </span>
              <span className="text-stone-500 dark:text-stone-400">
                {formatCurrency(currentMetric.totalExpenses)} gastos
              </span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg text-center">
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">
                Promedio diario
              </p>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 font-mono">
                {formatCurrency(metrics.averageCostPerDay)}
              </p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg text-center">
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">
                CAC general
              </p>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 font-mono">
                {metrics.overallCac !== null ? formatCurrency(metrics.overallCac) : '—'}
              </p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg text-center">
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">
                Clientes mes
              </p>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 font-mono">
                {metrics.monthly.newClients}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
