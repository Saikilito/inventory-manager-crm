import React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ProductShape, StockLotItemInput } from "./stockLotModalTypes";

interface LotFormItemsProps {
  items: StockLotItemInput[];
  products: ProductShape[];
  totalCost: number;
  handleAddItem: () => void;
  handleRemoveItem: (index: number) => void;
  handleItemChange: (index: number, field: keyof StockLotItemInput, value: string | boolean) => void;
}

export const LotFormItems: React.FC<LotFormItemsProps> = ({
  items,
  products,
  totalCost,
  handleAddItem,
  handleRemoveItem,
  handleItemChange,
}) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
          2. Inventory Items
        </h3>
      </div>

      <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 bg-stone-100/50 dark:bg-stone-800/30 border-b border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          <div className="col-span-4">Product</div>
          <div className="col-span-2">Qty</div>
          <div className="col-span-2">Unit Cost</div>
          <div className="col-span-3">Selling Price</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-stone-200 dark:divide-stone-800">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 transition-colors hover:bg-white dark:hover:bg-stone-900">
              
              {/* Product Selection Group */}
              <div className="md:col-span-4 space-y-2">
                <div className="md:hidden text-xs font-semibold text-stone-500 uppercase">Product</div>
                <div className="relative">
                  <input
                    type="text"
                    value={item.productName}
                    onChange={(e) => handleItemChange(index, "productName", e.target.value)}
                    placeholder="Product name..."
                    className="w-full px-2.5 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-blue-400"
                  />
                  {item.productName && (
                    <div className="absolute right-2 top-1.5 text-[10px] px-1.5 py-0.5 rounded-sm font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {item.isNewProduct ? "New" : "Found"}
                    </div>
                  )}
                </div>
                <select
                  value={item.selectedProductId}
                  onChange={(e) => handleItemChange(index, "selectedProductId", e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                >
                  <option value="">-- Choose or type above --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {Number(product.stock ?? 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="md:col-span-2 space-y-1">
                <div className="md:hidden text-xs font-semibold text-stone-500 uppercase">Quantity</div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Unit Cost */}
              <div className="md:col-span-2 space-y-1">
                <div className="md:hidden text-xs font-semibold text-stone-500 uppercase">Unit Cost</div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-stone-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitCost}
                    onChange={(e) => handleItemChange(index, "unitCost", e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2.5 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Selling Price */}
              <div className="md:col-span-3 space-y-1">
                <div className="md:hidden text-xs font-semibold text-stone-500 uppercase">Selling Price</div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-stone-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.confirmedSellingPrice}
                    onChange={(e) => handleItemChange(index, "confirmedSellingPrice", e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2.5 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex gap-1 text-[10px] font-medium mt-1 text-stone-400 justify-end">
                  {item.unitCost && item.confirmedSellingPrice && parseFloat(item.confirmedSellingPrice) > parseFloat(item.unitCost) && (
                    <span className="text-green-600 dark:text-green-400">
                      +{(((parseFloat(item.confirmedSellingPrice) - parseFloat(item.unitCost)) / parseFloat(item.confirmedSellingPrice)) * 100).toFixed(1)}% margin
                    </span>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="md:col-span-1 flex items-center justify-end md:justify-center md:pt-1">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length === 1}
                  className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Items Footer */}
        <div className="p-4 bg-stone-100/50 dark:bg-stone-800/30 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Another Item
          </button>
          <div className="text-sm">
            <span className="text-stone-500 mr-2">Total Cost:</span>
            <span className="text-lg font-bold text-stone-900 dark:text-stone-100">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
