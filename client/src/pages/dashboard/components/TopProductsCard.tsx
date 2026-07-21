import React from 'react';
import { TrendingUp, Package } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';

interface TopProductsCardProps {
  topSellers: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    profit?: number;
  }>;
  formatStock: (val: number) => string;
}

export const TopProductsCard: React.FC<TopProductsCardProps> = ({
  topSellers,
  formatStock,
}) => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Top Rotación</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Productos más vendidos
          </p>
        </div>
      </div>

      {topSellers.length > 0 ? (
        <div className="space-y-2">
          {topSellers.slice(0, 5).map((product, index) => (
            <div
              key={product.productId}
              className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950/40 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {product.productName}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {formatStock(product.quantitySold)} vendidos
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-stone-900 dark:text-stone-50 font-mono">
                  {formatCurrency(product.revenue)}
                </p>
                {product.profit !== undefined && product.profit > 0 && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{formatCurrency(product.profit)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-stone-400 dark:text-stone-500">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sin ventas registradas</p>
        </div>
      )}
    </div>
  );
};
