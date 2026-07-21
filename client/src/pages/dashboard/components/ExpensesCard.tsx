import React from 'react';
import { Receipt, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';

interface ExpensesCardProps {
  totalExpenses: number;
  expenseTrend?: number | null;
  accountDistribution: Array<{
    accountId: string;
    accountName: string;
    currency: string;
    totalReceivedUsd: number;
    percentage: number;
  }>;
  favoriteAccountName?: string;
  getPeriodLabel: (period: string) => string;
  selectedPeriod: string;
}

export const ExpensesCard: React.FC<ExpensesCardProps> = ({
  totalExpenses,
  expenseTrend,
  accountDistribution,
  favoriteAccountName,
}) => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Gastos</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Egresos del período
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-stone-900 dark:text-stone-50 font-mono">
            {formatCurrency(totalExpenses)}
          </p>
          {expenseTrend !== null && expenseTrend !== undefined && (
            <div
              className={`inline-flex items-center gap-1 text-xs font-bold ${
                expenseTrend >= 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {expenseTrend >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {expenseTrend >= 0 ? '+' : ''}
              {expenseTrend.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Account Distribution */}
      {accountDistribution.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Destino de Fondos
          </p>
          <div className="space-y-1">
            {accountDistribution.map((account) => {
              const isFavorite = account.accountName === favoriteAccountName;
              return (
                <div
                  key={account.accountId}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    isFavorite
                      ? 'bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800/20'
                      : 'bg-stone-50 dark:bg-stone-950/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isFavorite ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-600'
                      }`}
                    />
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      {account.accountName}
                    </span>
                    {isFavorite && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">
                        ★ FAVORITO
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-stone-900 dark:text-stone-50 font-mono">
                      {formatCurrency(account.totalReceivedUsd)}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500">
                      {account.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-stone-400 dark:text-stone-500">
          <Wallet className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Sin gastos registrados este período</p>
        </div>
      )}
    </div>
  );
};
