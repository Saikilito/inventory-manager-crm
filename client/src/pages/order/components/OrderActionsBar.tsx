import React from "react";

interface OrderActionsBarProps {
  total: number;
  onCancel: () => void;
  onCreateOrder: () => void;
  isDisabled: boolean;
  isLoading: boolean;
}

export const OrderActionsBar: React.FC<OrderActionsBarProps> = ({
  total,
  onCancel,
  onCreateOrder,
  isDisabled,
  isLoading,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 rounded-xl">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Order Total
        </span>
        <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
          ${total.toLocaleString()}
        </span>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors flex items-center gap-2 cursor-pointer"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          disabled={isDisabled || isLoading}
          onClick={onCreateOrder}
          type="button"
          className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
  );
};

export default OrderActionsBar;
