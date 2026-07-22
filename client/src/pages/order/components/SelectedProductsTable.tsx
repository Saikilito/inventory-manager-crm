import React from "react";
import { Trash2 } from "lucide-react";
import { IProduct } from "@shared-domain/product/product.entity";

interface SelectedProductsTableProps {
  selectedProducts: Array<IProduct & { quantity: number }>;
  onCountChange: (index: number, countVal: number, stock: number) => void;
  onRemoveProduct: (productId: string) => void;
}

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

              return (
                <tr
                  key={id}
                  className="text-stone-900 dark:text-stone-100 hover:bg-stone-50/50 dark:hover:bg-stone-900/20 transition-colors"
                >
                  <td className="px-4 py-3.5 font-medium">{p.name}</td>
                  <td className="px-4 py-3.5">${Number(p.sellingPrice).toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        stock < 10
                          ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {stock} avail.
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <input
                      type="number"
                      min="1"
                      max={stock}
                      className="w-20 h-11 px-3 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 rounded-lg text-center font-medium focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100"
                      value={p.quantity}
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
