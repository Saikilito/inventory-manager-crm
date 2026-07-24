import React from "react";
import { Link } from "react-router-dom";
import { Edit, Trash2, AlertTriangle, Info, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";
import type { IProduct } from "@shared-domain/product/product.entity";
import {
  STOCK_THRESHOLD_LOW,
  STOCK_THRESHOLD_MEDIUM,
  MARGIN_THRESHOLD_GOOD,
  MARGIN_THRESHOLD_OK,
} from "@modules/product/domain/product.constants";
import {
  calculateProfit,
  calculateProfitMargin,
  calculateStockValue,
  calculatePotentialProfit,
} from "@shared-domain/product/product-calculations";

interface ProductTableRowProps {
  product: IProduct;
  onDelete: (id: string, name: string) => void;
}

export const ProductTableRow: React.FC<ProductTableRowProps> = ({ product, onDelete }) => {
  const id = product.id!;
  const stock = Number(product.stock) || 0;
  const purchasePrice = Number(product.purchasePrice) || 0;
  const fallbackPrice = "price" in product ? Number((product as Record<string, unknown>).price) : 0;
  const sellingPrice = Number(product.sellingPrice ?? fallbackPrice) || 0;

  const profit = calculateProfit(sellingPrice, purchasePrice);
  const margin = calculateProfitMargin(sellingPrice, purchasePrice);
  const stockValue = calculateStockValue(purchasePrice, stock);
  const potentialProfit = calculatePotentialProfit(sellingPrice, purchasePrice, stock);

  let stockBadge = null;
  if (stock < STOCK_THRESHOLD_LOW) {
    stockBadge = (
      <span className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-2 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5" />
        {product.stock}
      </span>
    );
  } else if (stock < STOCK_THRESHOLD_MEDIUM) {
    stockBadge = (
      <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 px-2 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1">
        <Info className="w-3.5 h-3.5" />
        {product.stock}
      </span>
    );
  } else {
    stockBadge = (
      <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 px-2 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {product.stock}
      </span>
    );
  }

  const profitBadge = (
    <span
      className={`inline-flex items-center gap-1 font-mono ${
        profit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
      }`}
    >
      {profit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      ${profit.toFixed(2)}
    </span>
  );

  const marginColor =
    margin >= MARGIN_THRESHOLD_GOOD
      ? "text-emerald-700 dark:text-emerald-400 font-semibold"
      : margin >= MARGIN_THRESHOLD_OK
      ? "text-amber-700 dark:text-amber-400"
      : "text-red-700 dark:text-red-400";

  return (
    <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors border-b border-stone-100 dark:border-stone-800/60 last:border-b-0">
      <td className="px-6 py-4 text-sm font-medium text-stone-900 dark:text-stone-100">{product.name}</td>
      <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-300 font-mono text-right">
        ${purchasePrice.toFixed(2)}
      </td>
      <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-300 font-mono text-right">
        ${sellingPrice.toFixed(2)}
      </td>
      <td className="px-6 py-4 text-sm text-right">{profitBadge}</td>
      <td className="px-6 py-4 text-sm text-right">
        <span className={`font-mono ${marginColor}`}>{margin.toFixed(1)}%</span>
      </td>
      <td className="px-6 py-4 text-sm text-right">{stockBadge}</td>
      <td className="px-6 py-4 text-sm text-blue-700 dark:text-blue-400 font-mono text-right">
        ${stockValue.toFixed(2)}
      </td>
      <td className="px-6 py-4 text-sm font-mono text-right">
        <span
          className={
            potentialProfit >= 0
              ? "text-emerald-700 dark:text-emerald-400 font-semibold"
              : "text-red-700 dark:text-red-400"
          }
        >
          ${potentialProfit.toFixed(2)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm">
        <div className="flex items-center justify-center gap-2">
          <Link
            to={`/products/edit/${id}`}
            className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:bg-stone-300 dark:active:bg-stone-600 transition-colors"
          >
            <Edit className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Link>
          <button
            className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 active:bg-red-200 dark:active:bg-red-950/60 border border-red-200 dark:border-red-900/30 transition-colors"
            type="button"
            onClick={() => onDelete(id, product.name)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
};
