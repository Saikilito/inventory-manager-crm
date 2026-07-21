import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { formatCurrency } from "@utils/formatters";
import type { GQLProduct } from "@modules/product/infrastructure/graphql/types";

interface CatalogTabProps {
  products: GQLProduct[];
  productsLoading: boolean;
  onAddProduct: (product: GQLProduct) => void;
}

export const CatalogTab: React.FC<CatalogTabProps> = ({
  products,
  productsLoading,
  onAddProduct,
}) => {
  const [catalogSearch, setCatalogSearch] = useState("");

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={catalogSearch}
          onChange={(e) => setCatalogSearch(e.target.value)}
          className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          placeholder="Search motorcycle parts..."
        />
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
      </div>

      {productsLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          <span className="text-xs text-stone-400 mt-2 font-medium">Loading catalog...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <p className="text-center py-8 text-stone-400 text-xs font-semibold">No products found.</p>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((p) => (
            <div
              key={p._id}
              className="p-3 bg-stone-50 dark:bg-stone-950/40 border border-stone-100 dark:border-stone-850 rounded-xl flex items-center justify-between hover:border-stone-200 dark:hover:border-stone-800 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{p.name}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-stone-500">
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(p.sellingPrice || p.price)}</span>
                  <span>•</span>
                  <span className={p.stock < 5 ? "text-red-500 font-bold" : ""}>
                    Stock: {p.stock}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onAddProduct(p)}
                disabled={p.stock === 0}
                className="h-8 px-3 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50 rounded-lg transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
