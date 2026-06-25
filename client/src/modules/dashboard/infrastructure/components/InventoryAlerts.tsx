import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const InventoryAlerts: React.FC = () => {
  return (
    <div className="col-span-12 lg:col-span-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-200">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
            Critical Inventory Alerts (Low Stock)
          </h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 font-medium">
          Products with stock levels below the established minimum safety stock.
        </p>

        <div className="space-y-4">
          {/* Portland Cement */}
          <div className="flex items-center justify-between p-3.5 bg-stone-50/50 dark:bg-stone-950/20 border border-stone-200/50 dark:border-stone-800/50 rounded-xl">
            <div className="space-y-1">
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200">Portland Cement (x50)</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                Current stock: <span className="font-bold text-red-600 dark:text-red-400">12 units</span> (Minimum required: 30)
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/50">Critical</span>
          </div>

          {/* Deformed Steel Bar */}
          <div className="flex items-center justify-between p-3.5 bg-stone-50/50 dark:bg-stone-950/20 border border-stone-200/50 dark:border-stone-800/50 rounded-xl">
            <div className="space-y-1">
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200">Deformed Steel Bar (x100)</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                Current stock: <span className="font-bold text-amber-600 dark:text-amber-400">24 units</span> (Minimum required: 100)
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">Warning</span>
          </div>

          {/* White Latex Paint */}
          <div className="flex items-center justify-between p-3.5 bg-stone-50/50 dark:bg-stone-950/20 border border-stone-200/50 dark:border-stone-800/50 rounded-xl">
            <div className="space-y-1">
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200">White Latex Paint</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                Current stock: <span className="font-bold text-red-600 dark:text-red-400">8 units</span> (Minimum required: 20)
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/50">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
};
