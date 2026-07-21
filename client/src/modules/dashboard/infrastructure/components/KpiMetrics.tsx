import React from 'react';
import { DollarSign, Receipt, CreditCard } from 'lucide-react';
import { formatCurrency } from '../utils/format-currency';

export interface KpiMetricsProps {
  totalRevenue: number;
  ticketAverage: number;
  totalExpenses: number;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  totalRevenue,
  ticketAverage,
  totalExpenses,
}) => {
  return (
    <>
      {/* Card 1: Total Revenue */}
      <div className="col-span-12 md:col-span-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Completed Sales
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
            Total Revenue
          </p>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* Card 2: Ticket Average */}
      <div className="col-span-12 md:col-span-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Ticket Average
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1.5 tabular-nums">
            {formatCurrency(ticketAverage)}
          </p>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
            Average per Order
          </p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
          <Receipt className="w-6 h-6" />
        </div>
      </div>

      {/* Card 3: Expenses */}
      <div className="col-span-12 md:col-span-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Total Expenses
          </p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1.5 tabular-nums">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
            Registered Expenses
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl">
          <CreditCard className="w-6 h-6" />
        </div>
      </div>
    </>
  );
};
