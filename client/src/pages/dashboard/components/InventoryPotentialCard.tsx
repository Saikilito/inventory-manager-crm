import React from 'react';
import { PiggyBank, TrendingUp, Package, DollarSign } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_CONTEXT_METRICS } from '@modules/product/infrastructure/graphql/queries';
import { formatCurrency } from '@utils/formatters';

export const InventoryPotentialCard: React.FC = () => {
  const { data, loading } = useQuery(GET_CONTEXT_METRICS, {
    variables: { contextId: null, period: 'MONTHLY' },
    fetchPolicy: 'cache-first',
  });

  const metrics = data?.getContextMetrics;

  const investedCapital = metrics?.investedCapital || 0;
  const potentialRevenue = metrics?.potentialRevenue || 0;
  const projectedGrossMargin = metrics?.projectedGrossMargin || 0;
  const totalStock = metrics?.totalStock || 0;

  const projectedProfit = projectedGrossMargin;

  const marginPercent = potentialRevenue > 0 ? (projectedGrossMargin / potentialRevenue) * 100 : 0;

  const projectedROI = investedCapital > 0 ? (projectedProfit / investedCapital) * 100 : 0;

  if (loading) {
    return (
      <div className="col-span-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded w-48 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-stone-100 dark:bg-stone-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-12 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-stone-900 dark:to-stone-900 border border-emerald-200 dark:border-stone-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">Potencial de tu Inventario</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Si vendes todo tu stock actual, esto es lo que podrías ganar
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Dinero Invertido */}
        <div className="bg-white/60 dark:bg-stone-950/40 backdrop-blur-sm border border-stone-200 dark:border-stone-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Invertido en Stock
            </span>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-stone-50 font-mono">
            {formatCurrency(investedCapital)}
          </p>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">
            {totalStock.toLocaleString('es-DO', { maximumFractionDigits: 0 })} unidades físicas
          </p>
        </div>

        {/* Ventas Potenciales */}
        <div className="bg-white/60 dark:bg-stone-950/40 backdrop-blur-sm border border-stone-200 dark:border-stone-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Ventas Potenciales
            </span>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-stone-50 font-mono">
            {formatCurrency(potentialRevenue)}
          </p>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">Si vendes todo al precio actual</p>
        </div>

        {/* Ganancia Proyectada */}
        <div className="bg-emerald-100/80 dark:bg-emerald-950/30 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Ganancia Proyectada
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(projectedProfit)}
          </p>
          <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">
            Lo que te quedaría a ti y tu socio
          </p>
        </div>
      </div>

      {/* ROI y Margen */}
      <div className="grid grid-cols-2 gap-4">
        {/* Margen */}
        <div className="bg-white/40 dark:bg-stone-950/20 backdrop-blur-sm rounded-lg p-3 border border-stone-200/50 dark:border-stone-800/50">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Margen de Ganancia</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-black text-stone-900 dark:text-stone-50 font-mono">
              {marginPercent.toFixed(1)}%
            </p>
            <div className="flex-1 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(marginPercent, 100)}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">
            De cada $100 vendidos, ${marginPercent.toFixed(0)} son ganancia
          </p>
        </div>

        {/* ROI */}
        <div className="bg-white/40 dark:bg-stone-950/20 backdrop-blur-sm rounded-lg p-3 border border-stone-200/50 dark:border-stone-800/50">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">ROI Proyectado</p>
          <div className="flex items-center gap-2">
            <p
              className={`text-xl font-black font-mono ${
                projectedROI >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {projectedROI >= 0 ? '+' : ''}
              {projectedROI.toFixed(1)}%
            </p>
          </div>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">
            Por cada $1 invertido, ganarás ${(1 + projectedROI / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/50 dark:border-blue-800/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Cómo funciona:</strong> Tienes <strong>{formatCurrency(investedCapital)}</strong> invertidos en tu
          inventario. Si logras vender todo, facturarías <strong>{formatCurrency(potentialRevenue)}</strong> y te
          quedarían
          <strong className="text-emerald-600 dark:text-emerald-400"> {formatCurrency(projectedProfit)}</strong> de
          ganancia neta (después de recuperar tu inversión inicial).
        </p>
      </div>
    </div>
  );
};
