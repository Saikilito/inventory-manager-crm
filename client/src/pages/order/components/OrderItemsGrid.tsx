import { FileSpreadsheet } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';

interface OrderItem {
  productId: string;
  productName?: string | null;
  quantity: number;
  sellingPriceAtSale?: number | null;
}

interface OrderItemsGridProps {
  items: OrderItem[];
  getProductName: (item: OrderItem) => string;
}

export const OrderItemsGrid = ({ items, getProductName }: OrderItemsGridProps) => {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
        <FileSpreadsheet className="w-4 h-4 text-stone-400" />
        Order Items
      </h4>
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-950/20">
        <div className="grid grid-cols-12 bg-stone-50/50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800 px-4 py-2.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
          <div className="col-span-6">Product</div>
          <div className="col-span-2 text-right">Qty.</div>
          <div className="col-span-2 text-right">Unit Price</div>
          <div className="col-span-2 text-right">Subtotal</div>
        </div>
        <div className="divide-y divide-stone-100 dark:divide-stone-800/40">
          {items.map((item, idx) => {
            const itemSubtotal = (item.sellingPriceAtSale || 0) * item.quantity;
            return (
              <div
                key={idx}
                className="grid grid-cols-12 px-4 py-3 text-sm text-stone-800 dark:text-stone-200 items-center"
              >
                <div className="col-span-6 font-medium text-stone-900 dark:text-stone-100 truncate">
                  {getProductName(item)}
                </div>
                <div className="col-span-2 text-right font-mono text-xs">{item.quantity}</div>
                <div className="col-span-2 text-right font-mono text-xs">
                  {formatCurrency(item.sellingPriceAtSale || 0)}
                </div>
                <div className="col-span-2 text-right font-semibold font-mono text-stone-900 dark:text-white">
                  {formatCurrency(itemSubtotal)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
