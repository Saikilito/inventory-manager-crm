import React, { useMemo } from 'react';
import { match } from 'ts-pattern';
import { OrderStatus, PaymentStatus, DeliveryStatus } from '@shared-domain/order/order.entity';
import { OrderDetailModalProps } from '../types';
import { X, User, FileSpreadsheet, ChevronDown } from 'lucide-react';
import Alert from '../../../components/Alert';
import { PaymentSplitWidget } from './PaymentSplitWidget';
import { getFullName } from '@utils/formatters';
import { formatDate, formatCurrency } from '@utils/formatters';

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  clients,
  products,
  isOpen,
  isUpdating,
  updateError,
  onClose,
  onStatusChange,
}) => {
  if (!isOpen) return null;

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((client) => {
      map.set(client._id, getFullName(client));
    });
    return map;
  }, [clients]);

  const clientAddressMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((client) => {
      map.set(client._id, client.address || '');
    });
    return map;
  }, [clients]);

  const productMap = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => {
      map.set(product._id, product.name);
    });
    return map;
  }, [products]);

  const getClientName = (clientId: string): string => {
    return clientMap.get(clientId) || 'General Client';
  };

  const getClientAddress = (clientId: string): string => {
    return clientAddressMap.get(clientId) || '';
  };

  const getProductName = (productId: string): string => {
    return productMap.get(productId) || `Product (${productId.substring(18)})`;
  };

  const getStatusClasses = (status: OrderStatus): string => {
    return status === OrderStatus.ACTIVE
      ? 'bg-stone-50 dark:bg-stone-900/20 text-stone-700 dark:text-stone-400 border-stone-200 dark:border-stone-800/30 focus:ring-stone-500'
      : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30 focus:ring-red-500';
  };

  const getPaymentClasses = (status: PaymentStatus): string => {
    return match(status)
      .with(
        PaymentStatus.PENDING,
        () =>
          'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 focus:ring-amber-500',
      )
      .with(
        PaymentStatus.PAID,
        () =>
          'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 focus:ring-emerald-500',
      )
      .with(
        PaymentStatus.REFUNDED,
        () =>
          'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/30 focus:ring-purple-500',
      )
      .exhaustive();
  };

  const getDeliveryClasses = (status: DeliveryStatus): string => {
    return match(status)
      .with(
        DeliveryStatus.PENDING,
        () =>
          'bg-stone-50 dark:bg-stone-900/20 text-stone-700 dark:text-stone-400 border-stone-200 dark:border-stone-800/30 focus:ring-stone-500',
      )
      .with(
        DeliveryStatus.SENT,
        () =>
          'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30 focus:ring-blue-500',
      )
      .with(
        DeliveryStatus.COMPLETE,
        () =>
          'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 focus:ring-emerald-500',
      )
      .exhaustive();
  };

  const itemsSubtotal = useMemo(() => {
    return order.items.reduce((sum, item) => sum + (item.sellingPriceAtSale || 0) * item.quantity, 0);
  }, [order.items]);

  const effectiveDeliveryCost = order.deliveryCost !== undefined && order.deliveryCost !== null && order.deliveryCost > 0
    ? order.deliveryCost
    : order.total > itemsSubtotal
      ? order.total - itemsSubtotal
      : 0;

  return (
    <div className="fixed inset-0 bg-stone-950/60 dark:bg-stone-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-mono">
              Order Detail #{order._id.substring(18).toUpperCase()}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Issued on {formatDate(order.createdAt) || '-'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer h-11 w-11 flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {updateError && (
          <div className="px-6 pt-4 pb-0">
            <Alert message={updateError} type="error" />
          </div>
        )}

        <div className="px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="bg-stone-50 dark:bg-stone-950/30 border border-stone-100 dark:border-stone-800 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-sm font-semibold text-stone-700 dark:text-stone-300">
                <User className="w-5 h-5 text-stone-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {getClientName(order.clientId)}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">Client ID: {order.clientId}</p>
              </div>
            </div>
            {(order.customDeliveryAddress || getClientAddress(order.clientId)) && (
              <div className="border-t border-stone-200/55 dark:border-stone-800/60 pt-3 text-xs text-stone-600 dark:text-stone-400">
                <span className="font-bold block text-[10px] uppercase text-stone-400 tracking-wider mb-1">
                  Delivery Address:
                </span>
                <span className="font-medium">{order.customDeliveryAddress || getClientAddress(order.clientId)}</span>
                {order.customDeliveryAddress && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
                    Custom Address
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50/50 dark:bg-stone-900/40 p-4 rounded-xl border border-stone-100 dark:border-stone-800/80">
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Order Status
              </label>
              <div className="relative">
                <select
                  value={order.status}
                  onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
                  disabled={isUpdating}
                  aria-label="Change Order Status"
                  className={`appearance-none w-full h-11 pl-3 pr-10 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-stone-900 transition-all cursor-pointer ${getStatusClasses(order.status)}`}
                >
                  <option value={OrderStatus.ACTIVE}>Active</option>
                  <option value={OrderStatus.CANCELLED}>Cancelled</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Billing Status
              </label>
              <div className="relative">
                <select
                  value={order.paymentStatus || 'PENDING'}
                  onChange={(e) => {
                    const val = e.target.value as PaymentStatus;
                    onStatusChange(undefined, val);
                  }}
                  disabled={isUpdating || order.status === OrderStatus.CANCELLED}
                  aria-label="Change Payment Status"
                  className={`appearance-none w-full h-11 pl-3 pr-10 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-stone-900 transition-all cursor-pointer ${getPaymentClasses(order.paymentStatus || 'PENDING')}`}
                >
                  <option value={PaymentStatus.PENDING}>Unpaid</option>
                  {order.paymentStatus === PaymentStatus.PAID && <option value={PaymentStatus.PAID}>Paid</option>}
                  <option value={PaymentStatus.REFUNDED}>Refunded</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Delivery Status
              </label>
              <div className="relative">
                <select
                  value={order.deliveryStatus || 'PENDING'}
                  onChange={(e) => onStatusChange(undefined, undefined, e.target.value as DeliveryStatus)}
                  disabled={isUpdating || order.status === OrderStatus.CANCELLED}
                  aria-label="Change Delivery Status"
                  className={`appearance-none w-full h-11 pl-3 pr-10 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-stone-900 transition-all cursor-pointer ${getDeliveryClasses(order.deliveryStatus || 'PENDING')}`}
                >
                  <option value={DeliveryStatus.PENDING}>Pending</option>
                  <option value={DeliveryStatus.SENT}>Sent</option>
                  <option value={DeliveryStatus.COMPLETE}>Delivered</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-500" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {order.paymentStatus === PaymentStatus.PENDING && (
            <PaymentSplitWidget
              totalUSD={order.total}
              onCancel={onClose}
              onSave={async (payments) => {
                await onStatusChange(undefined, PaymentStatus.PAID, undefined, payments);
              }}
            />
          )}

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
                {order.items.map((item, idx) => {
                  const itemSubtotal = (item.sellingPriceAtSale || 0) * item.quantity;
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 px-4 py-3 text-sm text-stone-800 dark:text-stone-200 items-center"
                    >
                      <div className="col-span-6 font-medium text-stone-900 dark:text-stone-100 truncate">
                        {getProductName(item.productId)}
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
        </div>

        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950/20 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-2.5">
          {effectiveDeliveryCost > 0 ? (
            <div className="space-y-1.5 border-b border-stone-200/50 dark:border-stone-800/50 pb-2.5">
              <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
                <span>Products Subtotal:</span>
                <span className="font-semibold font-mono">{formatCurrency(order.total - effectiveDeliveryCost)}</span>
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
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
