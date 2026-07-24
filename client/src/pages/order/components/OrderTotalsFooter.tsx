import { formatCurrency } from '@utils/formatters';

interface OrderTotalsFooterProps {
  orderTotal: number;
  effectiveDeliveryCost: number;
}

export const OrderTotalsFooter = ({
  orderTotal,
  effectiveDeliveryCost,
}: OrderTotalsFooterProps) => {
  return (
    <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950/20 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-2.5">
      {effectiveDeliveryCost > 0 ? (
        <div className="space-y-1.5 border-b border-stone-200/50 dark:border-stone-800/50 pb-2.5">
          <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
            <span>Products Subtotal:</span>
            <span className="font-semibold font-mono">{formatCurrency(orderTotal - effectiveDeliveryCost)}</span>
          </div>
          <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
            <span>Delivery Cost:</span>
            <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
              + {formatCurrency(effectiveDeliveryCost)}
            </span>
          </div>
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-stone-800 dark:text-stone-200">Grand Total:</span>
        <span className="text-xl font-extrabold text-stone-950 dark:text-white font-mono">
          {formatCurrency(orderTotal)}
        </span>
      </div>
    </div>
  );
};
