import React from "react";
import { Layers, Loader2, Download, AlertCircle } from "lucide-react";
import { useContextMetricsLogic } from "../hooks/useContextMetricsLogic";
import { ContextKPIs } from "./ContextKPIs";
import { ProfitDistributionBar } from "./ProfitDistributionBar";
import { ContextMetricsLists } from "./ContextMetricsLists";

export const ContextConsolidatedMetrics: React.FC = () => {
  const logic = useContextMetricsLogic();
  const { state, actions, data, derived, utils } = logic;

  return (
    <div className="col-span-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-2xl shadow-sm p-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-1.5">
              Context Consolidation
              <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20">
                PRO
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Period-over-period financial consolidations and custom attribute metrics.
            </p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Context Selector */}
          <select
            className="min-h-[44px] px-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all"
            value={state.selectedContextId}
            onChange={(e) => actions.setSelectedContextId(e.target.value)}
            disabled={data.loadingContexts}
          >
            <option value="">General (All Contexts)</option>
            {data.contexts.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Period Selector */}
          <select
            className="min-h-[44px] px-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all"
            value={state.selectedPeriod}
            onChange={(e) => actions.setSelectedPeriod(e.target.value)}
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="SEMESTRALLY">Semestrally</option>
            <option value="ANNUALLY">Annually</option>
          </select>

          {/* Download Report Button */}
          <button
            onClick={actions.handleDownload}
            disabled={state.downloading}
            className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            {state.downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Report PDF
          </button>
        </div>
      </div>

      {state.downloadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {state.downloadError}
        </div>
      )}

      {/* Loading & Error States */}
      {data.loadingMetrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-stone-50 dark:bg-stone-950/40 border border-stone-100 dark:border-stone-800 rounded-xl"
            />
          ))}
        </div>
      ) : data.metricsError ? (
        <div className="text-center py-8 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-800/20 rounded-xl">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Error loading consolidated metrics: {data.metricsError.message}
          </p>
          <button
            onClick={() => actions.refetchMetrics()}
            className="mt-2 text-xs font-semibold text-stone-700 dark:text-stone-300 underline"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <ContextKPIs
            investedCapital={derived.investedCapital}
            totalStock={derived.totalStock}
            totalRevenue={derived.totalRevenue}
            revenueTrend={derived.revenueTrend}
            totalExpenses={derived.totalExpenses}
            expenseTrend={derived.expenseTrend}
            netProfit={derived.netProfit}
            profitTrend={derived.profitTrend}
            selectedPeriod={state.selectedPeriod}
            selectedContextId={state.selectedContextId}
            formatStock={utils.formatStock}
            getPeriodLabel={utils.getPeriodLabel}
          />

          <ProfitDistributionBar
            totalRevenue={derived.totalRevenue}
            totalCOGS={derived.totalCOGS}
            totalExpenses={derived.totalExpenses}
            netProfit={derived.netProfit}
            cogsPct={derived.cogsPct}
            expensePct={derived.expensePct}
            profitPct={derived.profitPct}
          />

          <ContextMetricsLists
            topSellers={derived.topSellers}
            accountDistribution={derived.accountDistribution}
            favoriteAccountName={derived.favoriteAccountName}
            formatStock={utils.formatStock}
          />
        </div>
      )}
    </div>
  );
};
