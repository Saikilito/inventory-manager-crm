import React from "react";
import { AlertTriangle } from "lucide-react";

interface OutOfStockItem {
  name: string;
  stock: number;
}

interface OrderActionsBarProps {
  total: number;
  onCancel: () => void;
  onCreateOrder: () => void;
  isDisabled: boolean;
  isLoading: boolean;
  outOfStockItems?: OutOfStockItem[];
}

export const OrderActionsBar: React.FC<OrderActionsBarProps> = ({
  total,
  onCancel,
  onCreateOrder,
  isDisabled,
  isLoading,
  outOfStockItems = [],
}) => {
  const hasOutOfStockProducts = outOfStockItems.length > 0;
  const actualDisabled = isDisabled || hasOutOfStockProducts;

  const getDisabledReason = () => {
    if (hasOutOfStockProducts) {
      const productNames = outOfStockItems.map((p) => p.name).join(", ");
      return `Cannot create order: ${outOfStockItems.length === 1 ? "product" : "products"} without stock (${productNames})`;
    }
    if (isDisabled) {
      return "Select a client and add at least one product";
    }
    return null;
  };

  const disabledReason = getDisabledReason();

  return (
    <div className="space-y-4">
      {hasOutOfStockProducts && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Cannot create order
            </p>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">
              The following {outOfStockItems.length === 1 ? "product has" : "products have"} no stock:
            </p>
            <ul className="mt-2 text-sm text-red-700 dark:text-red-300 font-medium">
              {outOfStockItems.map((item) => (
                <li key={item.name} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                  {item.name} (stock: {item.stock})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 rounded-xl">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Order Total
          </span>
          <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
            ${total.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {disabledReason && actualDisabled && !hasOutOfStockProducts && (
            <span className="text-xs text-stone-500 dark:text-stone-400 text-right">
              {disabledReason}
            </span>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors flex items-center gap-2 cursor-pointer"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              disabled={actualDisabled || isLoading}
              onClick={onCreateOrder}
              type="button"
              title={disabledReason || "Create the order"}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                actualDisabled
                  ? "bg-stone-300 dark:bg-stone-700 text-stone-500 dark:text-stone-400 cursor-not-allowed"
                  : "bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-stone-100"
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </>
              ) : (
                "Create Order"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderActionsBar;
