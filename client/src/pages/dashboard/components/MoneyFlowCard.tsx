import React from 'react';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';

interface MoneyFlowCardProps {
  totalRevenue: number;
  reinvestment: number;
  netProfit: number;
  revenueTrend?: number | null;
  profitTrend?: number | null;
  expenseTrend?: number | null;
}

export const MoneyFlowCard: React.FC<MoneyFlowCardProps> = ({
  totalRevenue,
  reinvestment,
  netProfit,
  revenueTrend,
  profitTrend,
}) => {
  const renderTrend = (trend: number | null | undefined) => {
    if (trend === null || trend === undefined) return null;
    const isPositive = trend >= 0;
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
          isPositive
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10'
        }`}
      >
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>
          {isPositive ? '+' : ''}
          {trend.toFixed(1)}%
        </span>
      </div>
    );
  };

  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const reinvestPercent = totalRevenue > 0 ? (reinvestment / totalRevenue) * 100 : 0;
  const profitPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">Flujo de Dinero</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Lo que entra, lo que vuelve al negocio, lo que te quedas
          </p>
        </div>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ventas Brutas */}
        <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-800/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Ventas Brutas
            </span>
            <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-stone-50 font-mono">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">Lo que facturaste</p>
          <div className="mt-2">{renderTrend(revenueTrend)}</div>
        </div>

        {/* Reinversión */}
        <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-800/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Reinversión
            </span>
            <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-stone-50 font-mono">
            {formatCurrency(reinvestment)}
          </p>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">Para reponer stock</p>
          <div className="mt-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {reinvestPercent.toFixed(1)}% de ventas
            </span>
          </div>
        </div>

        {/* Ganancia Neta */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Ganancia Neta
            </span>
            <div className="p-1.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(netProfit)}
          </p>
          <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">
            Lo que te quedas tú y tu socio
          </p>
          <div className="mt-2 flex items-center gap-2">
            {renderTrend(profitTrend)}
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {profitMargin.toFixed(1)}% margen
            </span>
          </div>
        </div>
      </div>

      {/* Distribution Bar */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Distribución
        </p>
        <div className="h-8 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden flex">
          {/* Reinversión */}
          <div
            className="bg-amber-500 flex items-center justify-center text-white text-xs font-bold"
            style={{ width: `${reinvestPercent}%` }}
          >
            {reinvestPercent > 15 && `${reinvestPercent.toFixed(0)}%`}
          </div>
          {/* Ganancia */}
          <div
            className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold"
            style={{ width: `${profitPercent}%` }}
          >
            {profitPercent > 15 && `${profitPercent.toFixed(0)}%`}
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded" />
            <span className="text-stone-600 dark:text-stone-400">
              <strong>Reinversión:</strong> {formatCurrency(reinvestment)} - para reponer stock
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span className="text-stone-600 dark:text-stone-400">
              <strong>Ganancia:</strong> {formatCurrency(netProfit)} - para ti y tu socio
            </span>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-800/20 rounded-xl">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Cómo funciona:</strong> De cada <strong>{formatCurrency(totalRevenue)}</strong> que vendes,
          aproximadamente <strong>{formatCurrency(reinvestment)}</strong> deben volver al negocio para reponer el stock
          vendido. Lo que queda, <strong>{formatCurrency(netProfit)}</strong>, es la ganancia real que pueden repartir
          tú y tu socio.
        </p>
      </div>
    </div>
  );
};
