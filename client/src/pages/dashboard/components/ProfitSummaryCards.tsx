import React from "react";
import { formatCurrency } from "@utils/formatters";
import { ProfitDetailSummary } from "@modules/dashboard/infrastructure/utils/aggregation";

interface ProfitSummaryCardsProps {
  summary: ProfitDetailSummary | null;
  grossMarginPct: number;
}

export const ProfitSummaryCards: React.FC<ProfitSummaryCardsProps> = ({ summary, grossMarginPct }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Revenue */}
      <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-800/40 rounded-xl p-4 flex flex-col justify-between space-y-2">
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Ingresos Totales
        </span>
        <div>
          <h3 className="text-xl font-black text-stone-900 dark:text-stone-50 font-mono tracking-tight">
            {formatCurrency(summary.totalSales)}
          </h3>
        </div>
      </div>

      {/* COGS */}
      <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-800/40 rounded-xl p-4 flex flex-col justify-between space-y-2">
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Costo de Ventas (COGS)
        </span>
        <div>
          <h3 className="text-xl font-black text-stone-900 dark:text-stone-50 font-mono tracking-tight text-amber-600 dark:text-amber-500">
            {formatCurrency(summary.totalCOGS)}
          </h3>
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-800/40 rounded-xl p-4 flex flex-col justify-between space-y-2">
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Gastos Operativos
        </span>
        <div>
          <h3 className="text-xl font-black text-stone-900 dark:text-stone-50 font-mono tracking-tight text-rose-600 dark:text-rose-400">
            {formatCurrency(summary.totalExpenses)}
          </h3>
        </div>
      </div>

      {/* Calculated Profit */}
      <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-800/40 rounded-xl p-4 flex flex-col justify-between space-y-2">
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Ganancia Real (Neto)
        </span>
        <div>
          <h3 className={`text-xl font-black font-mono tracking-tight ${summary.calculatedNetProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {formatCurrency(summary.calculatedNetProfit)}
          </h3>
        </div>
      </div>

      {/* Gross Margin % */}
      <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-800/40 rounded-xl p-4 flex flex-col justify-between space-y-2">
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Margen de Ganancia %
        </span>
        <div>
          <h3 className="text-xl font-black text-stone-900 dark:text-stone-50 font-mono tracking-tight">
            {grossMarginPct.toFixed(2)}%
          </h3>
        </div>
      </div>
    </div>
  );
};
