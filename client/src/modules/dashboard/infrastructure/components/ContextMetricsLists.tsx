import React from "react";
import { formatCurrency } from "@utils/formatters";

interface ContextMetricsListsProps {
  topSellers: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    profit?: number;
  }>;
  accountDistribution: Array<{
    accountId: string;
    accountName: string;
    currency: string;
    totalReceivedUsd: number;
    percentage: number;
  }>;
  favoriteAccountName?: string;
  formatStock: (val: number) => string;
}

export const ContextMetricsLists: React.FC<ContextMetricsListsProps> = ({
  topSellers,
  accountDistribution,
  favoriteAccountName,
  formatStock,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Column 1: Top Performing Products (6 cols) */}
      <div className="lg:col-span-6 border border-stone-200/60 dark:border-stone-800/60 rounded-xl overflow-hidden bg-stone-50/40 dark:bg-stone-950/10 flex flex-col">
        <div className="px-4 py-3 bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Productos Más Vendidos
          </h4>
          <span className="text-[10px] font-semibold text-stone-400">Ordenado por facturación</span>
        </div>

        {topSellers.length > 0 ? (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/40 flex-1">
            {topSellers.map((item) => (
              <div
                key={item.productId}
                className="px-4 py-3 flex items-center justify-between hover:bg-stone-100/40 dark:hover:bg-stone-950/20 transition-all"
              >
                <div>
                  <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {item.productName}
                  </div>
                  <div className="text-xs text-stone-400">
                    Cant. Vendida:{" "}
                    <span className="font-semibold text-stone-600 dark:text-stone-300 font-mono">
                      {formatStock(item.quantitySold)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-stone-900 dark:text-stone-50 font-mono">
                    {formatCurrency(item.revenue)}
                  </div>
                  <div className="text-[10px] text-stone-400 font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    Ganancia: +{formatCurrency(item.profit || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-stone-400 font-medium flex-1 flex items-center justify-center">
            No hay ventas registradas para este contexto.
          </div>
        )}
      </div>

      {/* Column 2: Account Flow Distribution (6 cols) */}
      <div className="lg:col-span-6 border border-stone-200/60 dark:border-stone-800/60 rounded-xl overflow-hidden bg-stone-50/40 dark:bg-stone-950/10 flex flex-col">
        <div className="px-4 py-3 bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Destino de Fondos por Cuenta
          </h4>
          <span className="text-[10px] font-semibold text-stone-400">Volumen recibido en USD</span>
        </div>

        {accountDistribution.length > 0 ? (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/40 flex-1">
            {accountDistribution.map((acc) => {
              const isFavorite = acc.accountName === favoriteAccountName;
              return (
                <div
                  key={acc.accountId}
                  className={`px-4 py-3.5 flex items-center justify-between hover:bg-stone-100/40 dark:hover:bg-stone-950/20 transition-all ${
                    isFavorite ? "bg-amber-500/[0.02] dark:bg-amber-500/[0.01]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isFavorite ? "bg-amber-500 animate-pulse" : "bg-stone-300 dark:bg-stone-700"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        {acc.accountName}
                        {isFavorite && (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-500 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                            ★ Favorito
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400">
                        Moneda nativa: <span className="font-bold text-stone-500">{acc.currency}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-stone-900 dark:text-stone-50 font-mono">
                      {formatCurrency(acc.totalReceivedUsd)}
                    </div>
                    <div className="text-[10px] text-stone-400 font-bold font-mono">
                      {acc.percentage.toFixed(1)}% del volumen
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-stone-400 font-medium flex-1 flex items-center justify-center">
            Sin transacciones o ingresos de caja registrados.
          </div>
        )}
      </div>
    </div>
  );
};
