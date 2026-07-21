import React, { useState, useMemo } from 'react';
import { z } from 'zod';
import { IProduct } from '@shared-domain/product/product.entity';

// Define strict validation schema using Zod
const productFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  stock: z.number().min(0, 'Stock cannot be negative'),
});

interface ProductFormProps {
  product?: IProduct;
  onSubmit: (data: {
    name: string;
    purchasePrice: number;
    sellingPrice: number;
    stock: number;
  }) => void;
  submitButtonText?: string;
  isLoading?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  submitButtonText = 'Save Changes',
  isLoading = false,
}) => {
  const [name, setName] = useState(product ? String(product.name) : '');
  const [purchasePrice, setPurchasePrice] = useState<string | number>(
    product ? (Number(product.purchasePrice) || Number(product.price) || '') : ''
  );
  const [sellingPrice, setSellingPrice] = useState<string | number>(
    product ? (Number(product.sellingPrice) || Number(product.price) || '') : ''
  );
  const [stock, setStock] = useState<string | number>(product ? Number(product.stock) : '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate profit in real-time
  const calculatedValues = useMemo(() => {
    const pp = Number(purchasePrice) || 0;
    const sp = Number(sellingPrice) || 0;
    const st = Number(stock) || 0;
    
    const profit = sp - pp;
    const margin = sp > 0 ? (profit / sp) * 100 : 0;
    const stockValue = pp * st;
    const potentialProfit = profit * st;

    return {
      profit: profit.toFixed(2),
      margin: margin.toFixed(1),
      stockValue: stockValue.toFixed(2),
      potentialProfit: potentialProfit.toFixed(2),
      isProfitPositive: profit >= 0,
    };
  }, [purchasePrice, sellingPrice, stock]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationResult = productFormSchema.safeParse({
      name,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      stock: Number(stock),
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    onSubmit({
      name,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      stock: Number(stock),
    });
  };

  const isButtonDisabled = !name || purchasePrice === '' || sellingPrice === '' || stock === '';

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Product Name:
          </label>
          <input
            type="text"
            className={`w-full h-11 px-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-950 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all ${
              errors.name ? 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500' : ''
            }`}
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && (
            <div className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
              {errors.name}
            </div>
          )}
        </div>

        {/* Price Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              Purchase Price (Cost):
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-stone-500 dark:text-stone-400 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                className={`w-full h-11 pl-8 pr-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-950 dark:text-white placeholder-stone-450 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all ${
                  errors.purchasePrice ? 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500' : ''
                }`}
                placeholder="0.00"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
            {errors.purchasePrice && (
              <div className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
                {errors.purchasePrice}
              </div>
            )}
            <p className="text-xs text-stone-500 dark:text-stone-400">What you pay to acquire the product</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              Selling Price:
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-stone-500 dark:text-stone-400 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                className={`w-full h-11 pl-8 pr-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-950 dark:text-white placeholder-stone-450 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all ${
                  errors.sellingPrice ? 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500' : ''
                }`}
                placeholder="0.00"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
              />
            </div>
            {errors.sellingPrice && (
              <div className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
                {errors.sellingPrice}
              </div>
            )}
            <p className="text-xs text-stone-500 dark:text-stone-400">What you sell it for</p>
          </div>
        </div>

        {/* Profit Preview */}
        <div className={`p-4 rounded-lg border ${
          calculatedValues.isProfitPositive
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40'
        }`}>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Profit per unit:</span>
              <span className={`text-lg font-bold ${
                calculatedValues.isProfitPositive
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                ${calculatedValues.profit}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Margin:</span>
              <span className={`text-lg font-bold ${
                calculatedValues.isProfitPositive
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {calculatedValues.margin}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Inventory / Stock:
          </label>
          <input
            type="number"
            className={`w-full h-11 px-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-950 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all ${
              errors.stock ? 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500' : ''
            }`}
            placeholder="Product Stock"
            step="0.01"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          {errors.stock && (
            <div className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
              {errors.stock}
            </div>
          )}
        </div>

        {/* Stock Value Preview */}
        {Number(stock) > 0 && (
          <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40">
            <div className="flex flex-wrap gap-6 items-center justify-between">
              <div>
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Invested in Stock
                </span>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                  ${calculatedValues.stockValue}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Potential Profit
                </span>
                <p className={`text-lg font-bold ${
                  Number(calculatedValues.potentialProfit) >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  ${calculatedValues.potentialProfit}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-stone-100 dark:border-stone-800/60 mt-6">
          <button
            disabled={isButtonDisabled || isLoading}
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 hover:scale-[1.02] transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.001 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
