import React from "react";
import { Calendar, Package, DollarSign, CreditCard, TrendingUp } from "lucide-react";
import type { StockLot } from "../../../modules/product/infrastructure/graphql/stock-lot-types";

interface StockLotsTableProps {
  filteredStockLots: StockLot[];
  getProductNameById: (productId: string) => string;
}

export const StockLotsTable: React.FC<StockLotsTableProps> = ({
  filteredStockLots,
  getProductNameById,
}) => {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      RECEIVED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
      CANCELLED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
    };
    const labels: Record<string, string> = {
      RECEIVED: "Received",
      CANCELLED: "Cancelled",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.RECEIVED}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const styles: Record<string, string> = {
      CASH: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30",
      CREDIT: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[method] || styles.CASH}`}
      >
        {method === 'CASH' ? '💵 Cash' : '💳 Credit'}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredStockLots.map((lot) => {
        const shortId = lot.id.substring(18).toUpperCase();
        const lotTotal = lot.items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
        const lotProfit = lot.items.reduce((sum, item) => sum + item.projectedProfit, 0);
        const totalItems = lot.items.reduce((sum, item) => sum + item.quantity, 0);

        return (
          <div
            key={lot.id}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-5 border-b border-stone-150 dark:border-stone-850 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/20">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 font-mono tracking-wider">
                  LOT #{shortId}
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {lot.supplier}
                  </h3>
                  {getPaymentMethodBadge(lot.paymentMethod)}
                </div>
              </div>
              {getStatusBadge(lot.status)}
            </div>

            {/* Body */}
            <div className="p-5 flex-1 space-y-4">
              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                <Calendar className="w-4 h-4" />
                <span>{new Date(lot.purchaseDate).toLocaleDateString()}</span>
              </div>

              {/* Items Count */}
              <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                <Package className="w-4 h-4" />
                <span>{lot.items.length} products • {totalItems.toFixed(2)} units total</span>
              </div>

              {/* Lot Total */}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                <span className="text-stone-600 dark:text-stone-400">Purchase:</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  ${lotTotal.toFixed(2)}
                </span>
              </div>

              {/* Projected Profit */}
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-stone-600 dark:text-stone-400">Projected Profit:</span>
                <span className="font-bold text-purple-600">
                  ${lotProfit.toFixed(2)}
                </span>
              </div>

              {/* Items List */}
              <div className="border-t border-stone-200 dark:border-stone-800 pt-4 mt-4">
                <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
                  Products
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {lot.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between text-xs bg-stone-50 dark:bg-stone-950/20 p-2 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-stone-900 dark:text-stone-100">
                          {item.productName}
                          {item.isNewProduct && (
                            <span className="ml-1 text-[10px] text-blue-600 font-bold">(NEW)</span>
                          )}
                        </p>
                        <p className="text-stone-500 dark:text-stone-400">
                          {item.quantity.toFixed(2)} units @ ${item.unitCost.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">
                          ${item.confirmedSellingPrice.toFixed(2)}
                        </p>
                        <p className="text-stone-500 dark:text-stone-400">sell price</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/20">
              <p className="text-[10px] text-stone-400 dark:text-stone-500">
                Created {new Date(lot.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
