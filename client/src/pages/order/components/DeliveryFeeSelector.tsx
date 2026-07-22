import React from "react";
import { Truck } from "lucide-react";

const QUICK_DELIVERY_OPTIONS = [0, 2, 3, 4, 5] as const;

interface DeliveryFeeSelectorProps {
  deliveryFee: number;
  onChange: (fee: number) => void;
  subtotal: number;
}

export const DeliveryFeeSelector: React.FC<DeliveryFeeSelectorProps> = ({
  deliveryFee,
  onChange,
  subtotal,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="px-4 py-3 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800">
          <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-3.5 h-3.5" />
            Delivery Fee
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {QUICK_DELIVERY_OPTIONS.map((fee) => (
              <button
                key={fee}
                type="button"
                onClick={() => onChange(fee)}
                className={`h-10 text-sm font-semibold rounded-lg transition-all ${
                  deliveryFee === fee
                    ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                }`}
              >
                ${fee}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Custom:
            </label>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={deliveryFee || ""}
                onChange={(e) => onChange(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full h-9 pl-7 pr-3 text-sm font-medium text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="px-4 py-3 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800">
          <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Order Summary
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600 dark:text-stone-400">Subtotal</span>
            <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              ${subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600 dark:text-stone-400">Delivery</span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              +${deliveryFee.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
            <span className="text-sm font-bold text-stone-700 dark:text-stone-300">Total</span>
            <span className="text-xl font-black text-stone-900 dark:text-stone-100">
              ${(subtotal + deliveryFee).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryFeeSelector;
