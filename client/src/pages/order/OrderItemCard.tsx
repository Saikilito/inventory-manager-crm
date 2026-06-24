import React from 'react';
import { IOrder, OrderStatus } from '@shared-domain/order/order.entity';
import { Hash, Calendar, ChevronDown } from 'lucide-react';

interface OrderItemCardProps {
  order: IOrder;
  productMap: Map<string, string>;
  onStatusChange: (order: IOrder, newStatus: OrderStatus) => void;
}

export const OrderItemCard: React.FC<OrderItemCardProps> = ({
  order,
  productMap,
  onStatusChange,
}) => {
  const status = order.status;

  let borderClass = '';
  if (status === 'PENDING') {
    borderClass = 'border-stone-200 dark:border-stone-800 hover:shadow-md';
  } else if (status === 'CANCELLED') {
    borderClass = 'border-red-200 dark:border-red-900 bg-red-50/10 dark:bg-red-950/5';
  } else if (status === 'COMPLETED') {
    borderClass = 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/10 dark:bg-emerald-950/5';
  }

  return (
    <div className={`bg-white dark:bg-stone-900 border rounded-xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between ${borderClass}`}>
      <div className="space-y-4">
        {/* Order Header: ID & Date */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 min-w-0 flex-1 mr-3">
            <Hash className="w-4 h-4 text-stone-400 dark:text-stone-500 flex-shrink-0" />
            <span className="font-mono text-xs font-semibold truncate" title={String(order.id)}>
              {String(order.id)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs font-medium flex-shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(String(order.createdAt)).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Status Dropdown selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Estado
          </label>
          <div className="relative w-full">
            <select
              className="w-full appearance-none rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 pr-10 text-sm font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 dark:focus:ring-stone-400 transition-shadow cursor-pointer"
              value={status}
              onChange={(e) => onStatusChange(order, e.target.value as OrderStatus)}
            >
              <option value="PENDING">PENDIENTE</option>
              <option value="COMPLETED">COMPLETADO</option>
              <option value="CANCELLED">CANCELADO</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-stone-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Order Items Section */}
        <div>
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
            Artículos del pedido
          </h3>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-100 dark:border-stone-800/60 rounded-lg px-3 py-1 bg-stone-50/50 dark:bg-stone-900/30">
            {order.items.map((item, i) => {
              const prodId = String(item.productId);
              const productName = productMap.get(prodId) || 'Cargando producto...';

              return (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-stone-700 dark:text-stone-300 font-medium truncate mr-2" title={productName}>
                    {productName}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex-shrink-0">
                    Cant: {Number(item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Sleek high-contrast footer banner */}
      <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/50 rounded-lg flex items-center justify-between text-stone-900 dark:text-stone-100 font-semibold">
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Total</span>
        <span className="text-base font-bold">${Number(order.total).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default OrderItemCard;
