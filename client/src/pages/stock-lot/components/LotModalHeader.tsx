import React from "react";
import { X } from "lucide-react";
import type { StockLotInitialData } from "./stockLotModalTypes";

interface LotModalHeaderProps {
  initialData?: StockLotInitialData | null;
  onClose: () => void;
}

export const LotModalHeader: React.FC<LotModalHeaderProps> = ({ initialData, onClose }) => {
  return (
    <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          {initialData ? "Edit Stock Lot Draft" : "Create Stock Lot"}
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
          {initialData ? "Update your draft before receiving it." : "Record new inventory purchases and assign payments."}
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-300 rounded-full transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
