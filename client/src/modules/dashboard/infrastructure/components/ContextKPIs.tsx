import React from "react";
import { Link } from "react-router-dom";
import { Package, DollarSign, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { formatCurrency } from "@utils/formatters";

interface ContextKPIsProps {
  investedCapital: number;
  totalStock: number;
  totalRevenue: number;
  revenueTrend: number | null | undefined;
  totalExpenses: number;
  expenseTrend: number | null | undefined;
  netProfit: number;
  profitTrend: number | null | undefined;
  selectedPeriod: string;
  selectedContextId: string;
  formatStock: (val: number) => string;
  getPeriodLabel: (period: string) => string;
}

export const ContextKPIs: React.FC<ContextKPIsProps> = ({
  investedCapital,
  totalStock,
  totalRevenue,
  revenueTrend,
  totalExpenses,
  expenseTrend,
  netProfit,
  profitTrend,
  selectedPeriod,
  selectedContextId,
  formatStock,
  getPeriodLabel,
}) => {
  const renderTrendBadge = (trend: number | undefined | null) => {
    if (trend === undefined || trend === null) return null;
    const isPositive = trend >= 0;
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black ${
          isPositive
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10"
            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10"
        }`}
      >
        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        <span>
          {isPositive ? "+" : ""}
          {trend}% vs {getPeriodLabel(selectedPeriod)}
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Capital Inmovilizado / Stock Invertido */}
      <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-800/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Stock Invertido ($)
          </span>
          <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-lg border border-amber-500/10">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-stone-900 dark:text-stone-50 font-mono tracking-tight">
            {formatCurrency(investedCapital)}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            En {formatStock(totalStock)} unidades físicas
          </p>
        </div>
      </div>

      {/* Total Sales (Ingresos) */}
      <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-800/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Ventas Facturadas
          </span>
          <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-500/10">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-stone-900 dark:text-stone-50 font-mono tracking-tight">
            {formatCurrency(totalRevenue)}
          </h3>
          <div className="mt-1">{renderTrendBadge(revenueTrend)}</div>
        </div>
      </div>

      {/* Total Expenses */}
      <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-800/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Egresos/Gastos
          </span>
          <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-500/10">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-stone-900 dark:text-stone-50 font-mono tracking-tight">
            {formatCurrency(totalExpenses)}
          </h3>
          <div className="mt-1">{renderTrendBadge(expenseTrend)}</div>
        </div>
      </div>

      {/* Net Profit (Ganancia Real) */}
      <Link
        to={`/dashboard/profit-detail?period=${selectedPeriod}&contextId=${selectedContextId}`}
        className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-800/40 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-emerald-500/40 hover:bg-stone-100/30 dark:hover:bg-stone-950/60 active:scale-[0.99] transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Ganancia Real (Neto)
          </span>
          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/10">
            {netProfit >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
          </div>
        </div>
        <div>
          <h3
            className={`text-2xl font-black font-mono tracking-tight ${
              netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatCurrency(netProfit)}
          </h3>
          <div className="mt-1">{renderTrendBadge(profitTrend)}</div>
        </div>
      </Link>
    </div>
  );
};
