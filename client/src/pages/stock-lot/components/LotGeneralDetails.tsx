import React from "react";
import type { ContextShape } from "./stockLotModalTypes";

interface LotGeneralDetailsProps {
  supplier: string;
  setSupplier: (val: string) => void;
  contextId: string;
  setContextId: (val: string) => void;
  purchaseDate: string;
  setPurchaseDate: (val: string) => void;
  contexts: ContextShape[];
}

export const LotGeneralDetails: React.FC<LotGeneralDetailsProps> = ({
  supplier,
  setSupplier,
  contextId,
  setContextId,
  purchaseDate,
  setPurchaseDate,
  contexts,
}) => {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
        1. General Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Supplier Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g., TechSupply Co"
            className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Context / Branch
          </label>
          <select
            value={contextId}
            onChange={(e) => setContextId(e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
          >
            <option value="">General (No Context)</option>
            {(contexts || []).map((ctx) => (
              <option key={ctx._id} value={ctx._id}>
                {ctx.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Purchase Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
          />
        </div>
      </div>
    </section>
  );
};
