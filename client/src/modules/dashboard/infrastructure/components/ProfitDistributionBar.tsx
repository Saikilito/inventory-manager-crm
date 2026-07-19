import React from "react";
import { formatCurrency } from "@utils/formatters";

interface ProfitDistributionBarProps {
  totalRevenue: number;
  totalCOGS: number;
  totalExpenses: number;
  netProfit: number;
  cogsPct: number;
  expensePct: number;
  profitPct: number;
}

export const ProfitDistributionBar: React.FC<ProfitDistributionBarProps> = ({
  totalRevenue,
  totalCOGS,
  totalExpenses,
  netProfit,
  cogsPct,
  expensePct,
  profitPct,
}) => {
  return (
    <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-800/40 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Distribución Analítica de Ventas
          </h4>
          <p className="text-xs text-stone-500">
            ¿A dónde van los fondos facturados en este período?
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-stone-400 font-semibold uppercase">Total Facturado</span>
          <div className="text-lg font-black text-stone-800 dark:text-stone-100 font-mono">
            {formatCurrency(totalRevenue)}
          </div>
        </div>
      </div>

      {totalRevenue > 0 ? (
        <div className="space-y-3">
          {/* Visual stacked bar */}
          <div className="h-4 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${cogsPct}%` }}
              className="h-full bg-amber-500 hover:opacity-90 transition-all duration-300"
              title={`Reinversión / COGS: ${cogsPct.toFixed(1)}%`}
            />
            <div
              style={{ width: `${expensePct}%` }}
              className="h-full bg-rose-500 hover:opacity-90 transition-all duration-300"
              title={`Gastos: ${expensePct.toFixed(1)}%`}
            />
            <div
              style={{ width: `${Math.max(0, profitPct)}%` }}
              className="h-full bg-emerald-500 hover:opacity-90 transition-all duration-300"
              title={`Ganancia Real: ${profitPct.toFixed(1)}%`}
            />
          </div>

          {/* Legend and Values */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* COGS Segment */}
            <div className="flex items-start gap-2.5">
              <div className="w-3 h-3 rounded bg-amber-500 mt-1 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Reinversión de Stock (Costo)
                </div>
                <div className="text-sm font-black text-stone-800 dark:text-stone-100 font-mono">
                  {formatCurrency(totalCOGS)}
                </div>
                <div className="text-xs font-semibold text-stone-400">
                  {cogsPct.toFixed(1)}% de las ventas
                </div>
              </div>
            </div>

            {/* Expenses Segment */}
            <div className="flex items-start gap-2.5">
              <div className="w-3 h-3 rounded bg-rose-500 mt-1 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Gastos de Operación (Egresos)
                </div>
                <div className="text-sm font-black text-stone-800 dark:text-stone-100 font-mono">
                  {formatCurrency(totalExpenses)}
                </div>
                <div className="text-xs font-semibold text-stone-400">
                  {expensePct.toFixed(1)}% de las ventas
                </div>
              </div>
            </div>

            {/* Net Profit Segment */}
            <div className="flex items-start gap-2.5">
              <div className="w-3 h-3 rounded bg-emerald-500 mt-1 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Ganancia Real Limpia (Neto)
                </div>
                <div
                  className={`text-sm font-black font-mono ${
                    netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"
                  }`}
                >
                  {formatCurrency(netProfit)}
                </div>
                <div className="text-xs font-semibold text-stone-400">
                  {profitPct.toFixed(1)}% de las ventas
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-xs font-medium text-stone-400 bg-stone-100/50 dark:bg-stone-900/20 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
          Sin ventas ni flujos facturados para graficar el split en este período.
        </div>
      )}
    </div>
  );
};
