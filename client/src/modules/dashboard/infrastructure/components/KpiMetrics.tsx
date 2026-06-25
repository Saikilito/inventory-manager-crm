import React from 'react';
import { DollarSign, Users, Award, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/format-currency';

export interface KpiMetricsProps {
  totalRevenue: number;
  activeClientsCount: number;
  registeredSellersCount: number;
  maxSale: number;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  totalRevenue,
  activeClientsCount,
  registeredSellersCount,
  maxSale,
}) => {
  return (
    <>
      {/* Card 1: Total Revenue */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Completed Sales
          </p>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1.5 tabular-nums">
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

      {/* Card 2: Active Clients */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Buyers in CRM
          </p>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1.5 tabular-nums">
            {activeClientsCount}
          </p>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
            Active Clients
          </p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Card 3: Sellers */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Star Sellers
          </p>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1.5 tabular-nums">
            {registeredSellersCount}
          </p>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
            Registered Sellers
          </p>
        </div>
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Award className="w-6 h-6" />
        </div>
      </div>

      {/* Card 4: Maximum Sale */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Highest registered purchase
          </p>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1.5 tabular-nums">
            {formatCurrency(maxSale)}
          </p>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
            Maximum Sale
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl">
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>
    </>
  );
};
