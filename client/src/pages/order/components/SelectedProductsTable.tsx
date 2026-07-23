import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { IProduct } from "@shared-domain/product/product.entity";

interface SelectedProductsTableProps {
  selectedProducts: Array<IProduct & { quantity: number }>;
  onCountChange: (index: number, countVal: number, stock: number) => void;
  onRemoveProduct: (productId: string) => void;
}

const getStockBadgeConfig = (stock: number) => {
  if (stock === 0) {
    return {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-600 dark:text-red-400",
      label: "Sin stock",
      showWarning: true,
    };
  }
  if (stock < 10) {
    return {
      bg: "bg-amber-50 dark:bg-amber-950/20",
      text: "text-amber-600 dark:text-amber-400",
      label: `${stock} disp.`,
      showWarning: false,
    };
  }
  return {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    text: "text-emerald-600 dark:text-emerald-400",
    label: `${stock} disp.`,
    showWarning: false,
  };
};

export const SelectedProductsTable: React.FC<SelectedProductsTableProps> = ({
  selectedProducts,
  onCountChange,
  onRemoveProduct,
}) => {
  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-950">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Inventory</th>
              <th className="px-4 py-3 text-center w-28">Quantity</th>
              <th className="px-4 py-3 text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {selectedProducts.map((p, index) => {
              const id = String(p.id);
              const stock = Number(p.stock);
              const badgeConfig = getStockBadgeConfig(stock);
              const isOutOfStock = stock === 0;

              return (
                <tr
                  key={id}
                  className={`text-stone-900 dark:text-stone-100 transition-colors ${
                    isOutOfStock
                      ? "bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20"
                      : "hover:bg-stone-50/50 dark:hover:bg-stone-900/20"
                  }`}
                >
                  <td className="px-4 py-3.5 font-medium">
                    <div className="flex items-center gap-2">
                      {isOutOfStock && (
                        <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                      )}
                      <span className={isOutOfStock ? "text-red-700 dark:text-red-400" : ""}>
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={isOutOfStock ? "text-red-600/70 dark:text-red-400/70" : ""}>
                      ${Number(p.sellingPrice).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeConfig.bg} ${badgeConfig.text}`}
                    >
                      {badgeConfig.showWarning && <AlertTriangle className="w-3 h-3" />}
                      {badgeConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <input
                      type="number"
                      min="1"
                      max={stock}
                      className={`w-20 h-11 px-3 rounded-lg text-center font-medium focus:outline-none transition-colors ${
                        isOutOfStock
                          ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 cursor-not-allowed"
                          : "border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100"
                      }`}
                      value={p.quantity}
                      disabled={isOutOfStock}
                      onChange={(e) =>
                        onCountChange(
                          index,
                          Number(e.target.value),
                          stock,
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-stone-950 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                      onClick={() => onRemoveProduct(id)}
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SelectedProductsTable;
