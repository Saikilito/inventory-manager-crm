import React from 'react';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { MoneyFlowCard } from './components/MoneyFlowCard';
import { PeriodTrendChart } from './components/PeriodTrendChart';
import { StockAlertsCard } from './components/StockAlertsCard';
import { TopProductsCard } from './components/TopProductsCard';
import { TopClientsCard } from './components/TopClientsCard';
import { ExpensesCard } from './components/ExpensesCard';
import { ProductiveDaysCard } from './components/ProductiveDaysCard';
import { SuggestionsCard } from './components/SuggestionsCard';
import {
  useAnalyticsLogic,
  getPeriodLabel,
  PERIOD_LABELS,
  PeriodType,
} from './hooks/useAnalyticsLogic';

export const AnalyticsPage: React.FC = () => {
  const {
    contextId,
    navigate,
    selectedPeriod,
    setSelectedPeriod,
    downloading,
    downloadError,
    currentContext,
    loadingMetrics,
    metricsError,
    refetch,
    handleDownload,
    formatStock,
    totalRevenue,
    reinvestment,
    netProfit,
    revenueTrend,
    profitTrend,
    expenseTrend,
    topSellers,
    accountDistribution,
    favoriteAccountName,
    totalExpenses,
  } = useAnalyticsLogic();

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      {/* Header section with back navigation and context title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
              Analytics: {currentContext?.name || 'General'}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Análisis profundo de tu negocio
            </p>
          </div>
        </div>

        {/* Period controls and PDF generation trigger */}
        <div className="flex items-center gap-3">
          <div className="flex bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as PeriodType[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  selectedPeriod === period
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-sm'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                }`}
              >
                {PERIOD_LABELS[period]}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            PDF
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-lg text-sm text-red-600 dark:text-red-400">
          {downloadError}
        </div>
      )}

      {loadingMetrics ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-stone-100 dark:bg-stone-800 rounded-xl" />
          ))}
        </div>
      ) : metricsError ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-800/20 rounded-xl text-center">
          <p className="text-red-600 dark:text-red-400">Error al cargar métricas</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm text-stone-600 dark:text-stone-400 underline"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* Money Flow metrics */}
          <MoneyFlowCard
            totalRevenue={totalRevenue}
            reinvestment={reinvestment}
            netProfit={netProfit}
            revenueTrend={revenueTrend}
            profitTrend={profitTrend}
            expenseTrend={expenseTrend}
          />

          {/* Historical trend for last 6 periods */}
          <PeriodTrendChart
            contextId={contextId}
            selectedPeriod={selectedPeriod}
          />

          {/* Inventory and stock metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StockAlertsCard contextId={contextId} />
            <TopProductsCard topSellers={topSellers} formatStock={formatStock} />
          </div>

          {/* Client behavior and productive periods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopClientsCard contextId={contextId} />
            <ProductiveDaysCard contextId={contextId} selectedPeriod={selectedPeriod} />
          </div>

          {/* Business expenses tracking and breakdown */}
          <ExpensesCard
            totalExpenses={totalExpenses}
            expenseTrend={expenseTrend}
            accountDistribution={accountDistribution}
            favoriteAccountName={favoriteAccountName}
            getPeriodLabel={getPeriodLabel}
            selectedPeriod={selectedPeriod}
          />

          {/* Business intelligence actionable suggestions */}
          <SuggestionsCard contextId={contextId} />
        </>
      )}
    </div>
  );
};
