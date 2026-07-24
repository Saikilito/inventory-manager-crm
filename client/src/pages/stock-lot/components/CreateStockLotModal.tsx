import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { CreateStockLotInput } from "../../../modules/product/infrastructure/graphql/stock-lot-types";

interface ProductShape {
  id: string;
  name: string;
  costPrice: number;
  stock: number;
}

interface CreateStockLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateStockLotInput) => Promise<any>;
  loading: boolean;
  products: ProductShape[];
}

interface StockLotItemInput {
  productName: string;
  quantity: string;
  unitCost: string;
  suggestedSellingPrice: string;
  confirmedSellingPrice: string;
  isNewProduct: boolean;
  selectedProductId: string;
}

export const CreateStockLotModal: React.FC<CreateStockLotModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  products,
}) => {
  const [supplier, setSupplier] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CREDIT">("CASH");
  const [accountId, setAccountId] = useState("");
  const [items, setItems] = useState<StockLotItemInput[]>([
    {
      productName: "",
      quantity: "",
      unitCost: "",
      suggestedSellingPrice: "",
      confirmedSellingPrice: "",
      isNewProduct: false,
      selectedProductId: "",
    },
  ]);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productName: "",
        quantity: "",
        unitCost: "",
        suggestedSellingPrice: "",
        confirmedSellingPrice: "",
        isNewProduct: false,
        selectedProductId: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof StockLotItemInput, value: string | boolean) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // If selecting an existing product, auto-fill details
    if (field === "selectedProductId" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].unitCost = product.costPrice.toString();
        newItems[index].isNewProduct = false;
      }
    }
    
    // If typing product name that matches existing product
    if (field === "productName") {
      const existingProduct = products.find(
        (p) => p.name.toLowerCase().trim() === (value as string).toLowerCase().trim()
      );
      if (existingProduct) {
        newItems[index].isNewProduct = false;
        newItems[index].selectedProductId = existingProduct.id;
      } else if ((value as string).trim()) {
        newItems[index].isNewProduct = true;
        newItems[index].selectedProductId = "";
      }
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplier.trim()) {
      setError("Supplier name is required");
      return;
    }

    if (!purchaseDate) {
      setError("Purchase date is required");
      return;
    }

    if (paymentMethod === "CASH" && !accountId) {
      setError("Account is required for CASH payment");
      return;
    }

    const validItems = items.filter(
      (item) =>
        item.productName.trim() &&
        parseFloat(item.quantity) > 0 &&
        parseFloat(item.unitCost) > 0 &&
        parseFloat(item.confirmedSellingPrice) > 0
    );

    if (validItems.length === 0) {
      setError("At least one valid item is required");
      return;
    }

    const input: CreateStockLotInput = {
      supplier: supplier.trim(),
      purchaseDate,
      paymentMethod,
      items: validItems.map((item) => ({
        productName: item.productName.trim(),
        quantity: parseFloat(item.quantity),
        unitCost: parseFloat(item.unitCost),
        suggestedSellingPrice: item.suggestedSellingPrice ? parseFloat(item.suggestedSellingPrice) : undefined,
        confirmedSellingPrice: parseFloat(item.confirmedSellingPrice),
        isNewProduct: item.isNewProduct,
      })),
      accountId: paymentMethod === "CASH" ? accountId : undefined,
    };

    const result = await onSubmit(input);
    if (result?.success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setSupplier("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("CASH");
    setAccountId("");
    setItems([
      {
        productName: "",
        quantity: "",
        unitCost: "",
        suggestedSellingPrice: "",
        confirmedSellingPrice: "",
        isNewProduct: false,
        selectedProductId: "",
      },
    ]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Create Stock Lot
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Supplier */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Supplier Name *
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g., TechSupply Co"
              className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Purchase Date *
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Payment Method *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                  paymentMethod === "CASH"
                    ? "bg-green-600 text-white"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                }`}
              >
                💵 Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CREDIT")}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                  paymentMethod === "CREDIT"
                    ? "bg-blue-600 text-white"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                }`}
              >
                💳 Credit
              </button>
            </div>
          </div>

          {/* Account (for CASH payment) */}
          {paymentMethod === "CASH" && (
            <div>
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                Payment Account *
              </label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Account ID"
                className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300">
                Items *
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 bg-stone-50 dark:bg-stone-950/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                      Item #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-950/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>

                  {/* Product Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Select Existing Product
                    </label>
                    <select
                      value={item.selectedProductId}
                      onChange={(e) => handleItemChange(index, "selectedProductId", e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                    >
                      <option value="">-- Or type product name below --</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (Stock: {product.stock.toFixed(2)}, Cost: ${product.costPrice.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => handleItemChange(index, "productName", e.target.value)}
                      placeholder="Product name"
                      className="w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                    />
                    {item.productName && (
                      <p className="text-[10px] mt-1 font-semibold text-blue-600">
                        {item.isNewProduct ? "✨ New product" : "📦 Existing product"}
                      </p>
                    )}
                  </div>

                  {/* Quantity & Cost */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Unit Cost *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitCost}
                        onChange={(e) => handleItemChange(index, "unitCost", e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>

                  {/* Selling Prices */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Suggested Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.suggestedSellingPrice}
                        onChange={(e) => handleItemChange(index, "suggestedSellingPrice", e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Confirmed Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.confirmedSellingPrice}
                        onChange={(e) => handleItemChange(index, "confirmedSellingPrice", e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-stone-600 dark:text-stone-400 font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Stock Lot"}
          </button>
        </div>
      </div>
    </div>
  );
};
