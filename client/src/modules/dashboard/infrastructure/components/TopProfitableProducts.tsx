import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';

export interface TopProfitableProductsProps {
  metrics: { topSellers?: { productId: string; productName: string; quantitySold: number; revenue: number; profit?: number }[] };
}

export const TopProfitableProducts: React.FC<TopProfitableProductsProps> = ({ metrics }) => {

  const topProfitable = useMemo(() => {
    if (!metrics?.topSellers) return [];

    // Sort by profit (net margin generated) rather than simple revenue
    return [...metrics.topSellers]
      .sort((a: { profit?: number }, b: { profit?: number }) => (b.profit || 0) - (a.profit || 0))
      .slice(0, 5);
  }, [metrics]);

  const formatStock = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 4,
    }).format(val);
  };



  return (
    <div className="col-span-12 lg:col-span-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-200 min-h-[350px]">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
            Top 5 Most Profitable Products
          </h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 font-medium">
          Products that have generated the highest net profits (revenue minus cost of acquisition) from completed sales.
        </p>

        {topProfitable.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-400 font-medium bg-stone-50/20 dark:bg-stone-950/5">
            No sales margins recorded for the current scope.
          </div>
        ) : (
          <div className="space-y-4">
            {topProfitable.map((item: { productId: string; productName: string; quantitySold: number; revenue: number; profit?: number }, idx: number) => (
              <div
                key={item.productId}
                className="flex items-center justify-between p-3 bg-stone-50/50 dark:bg-stone-950/20 border border-stone-200/50 dark:border-stone-800/50 rounded-xl hover:bg-stone-100/30 dark:hover:bg-stone-950/40 transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <span className="text-stone-400 text-[10px]">#{idx + 1}</span>
                    {item.productName}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                    Quantity sold: <span className="font-bold text-stone-700 dark:text-stone-300">{formatStock(item.quantitySold)} units</span>
                  </p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{formatCurrency(item.profit || 0)}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-stone-400 mt-0.5">Net Profit</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};