import React from 'react';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { match } from 'ts-pattern';
import { PRODUCTS_QUERY } from '@modules/product/infrastructure/graphql/queries';

interface StockAlertsCardProps {
  contextId?: string;
}

const LOW_STOCK_THRESHOLD = 5;
const CRITICAL_STOCK_THRESHOLD = 2;

export const StockAlertsCard: React.FC<StockAlertsCardProps> = () => {
  const navigate = useNavigate();

  const { data, loading } = useQuery(PRODUCTS_QUERY, {
    variables: { limit: 100 },
    fetchPolicy: 'cache-first',
  });

  const products = data?.getAllProducts || [];

  const stockAlerts = products
    .filter((p: { stock: number }) => p.stock <= LOW_STOCK_THRESHOLD)
    .map((p: { _id: string; name: string; stock: number }) => ({
      productId: p._id,
      productName: p.name,
      currentStock: p.stock,
      status: p.stock <= CRITICAL_STOCK_THRESHOLD ? 'critical' : p.stock <= LOW_STOCK_THRESHOLD ? 'low' : 'warning',
    }))
    .sort((a: { currentStock: number }, b: { currentStock: number }) => a.currentStock - b.currentStock)
    .slice(0, 5);

  const getAlertColor = (status: string) =>
    match(status)
      .with('critical', () => 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20')
      .with('low', () => 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20')
      .otherwise(() => 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20');

  const getAlertLabel = (status: string) =>
    match(status)
      .with('critical', () => 'URGENTE')
      .with('low', () => 'BAJO')
      .otherwise(() => 'VIGILAR');

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded w-32 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-stone-100 dark:bg-stone-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Stock Crítico</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Productos que necesitan reposición
            </p>
          </div>
        </div>
        {stockAlerts.length > 0 && (
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded">
            {stockAlerts.length} alertas
          </span>
        )}
      </div>

      {stockAlerts.length > 0 ? (
        <>
          <div className="space-y-2">
            {stockAlerts.map((alert: { productId: string; productName: string; currentStock: number; status: string }) => (
              <div
                key={alert.productId}
                className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950/40 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                onClick={() => navigate(`/products/edit/${alert.productId}`)}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-stone-400" />
                  <div>
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {alert.productName}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Stock actual: <strong className="text-rose-600 dark:text-rose-400">{alert.currentStock}</strong>
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-[10px] font-bold rounded border ${getAlertColor(
                    alert.status
                  )}`}
                >
                  {getAlertLabel(alert.status)}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/products')}
            className="mt-4 w-full py-2 text-sm font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 flex items-center justify-center gap-1 transition-colors"
          >
            Ver todos los productos
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      ) : (
        <div className="text-center py-8 text-stone-400 dark:text-stone-500">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay alertas de stock</p>
          <p className="text-xs mt-1">Todo está bien abastecido</p>
        </div>
      )}
    </div>
  );
};
