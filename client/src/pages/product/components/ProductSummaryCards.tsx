import React from "react";
import { DollarSign, TrendingUp } from "lucide-react";

interface ProductSummaryCardsProps {
  totalStockValue: number;
  totalPotentialProfit: number;
}

export const ProductSummaryCards: React.FC<ProductSummaryCardsProps> = ({
  totalStockValue,
  totalPotentialProfit,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              Total Invested in Stock
            </p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              ${totalStockValue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              Potential Profit (All Stock)
            </p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              ${totalPotentialProfit.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
