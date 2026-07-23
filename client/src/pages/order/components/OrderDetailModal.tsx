import React, { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { OrderStatus, PaymentStatus, DeliveryStatus } from '@shared-domain/order/order.entity';
import { OrderDetailModalProps, PaymentSplit, StatusChangeOptions } from '../types';
import { X, User, FileSpreadsheet, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import Alert from '../../../components/Alert';
import { PaymentSplitWidget } from './PaymentSplitWidget';
import { PaymentSummaryCard } from './PaymentSummaryCard';
import { getFullName } from '@utils/formatters';
import { formatDate, formatCurrency } from '@utils/formatters';
import { GET_ACCOUNTS } from '@modules/financial/infrastructure/graphql/queries';
import { getStatusClasses, getPaymentClasses, getDeliveryClasses } from '../utils/status-styles';
import { CancelOrderModal } from './CancelOrderModal';

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  clients,
  products,
  isOpen,
  isUpdating,
  updateError,
  showSuccessModal = false,
  onClose,
  onCloseSuccessModal,
  onStatusChange,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    newStatus?: OrderStatus;
    newPaymentStatus?: PaymentStatus;
    newDeliveryStatus?: DeliveryStatus;
    payments?: PaymentSplit[];
  } | null>(null);

  if (!isOpen) return null;

  const { data: accountsData } = useQuery(GET_ACCOUNTS, {
    fetchPolicy: 'cache-first',
  });
  const accounts = accountsData?.getAccounts || [];

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

  const getProductName = (item: { productId: string; productName?: string | null }): string => {
    if (item.productName) return item.productName;
    return productMap.get(item.productId) || `Product (${item.productId.substring(18)})`;
  };

  const handleStatusChange = (
    newStatus?: OrderStatus,
    newPaymentStatus?: PaymentStatus,
    newDeliveryStatus?: DeliveryStatus,
    payments?: PaymentSplit[],
  ) => {
    const needsObservation = newStatus === OrderStatus.CANCELLED || newPaymentStatus === PaymentStatus.REFUNDED;

    if (needsObservation) {
      setPendingStatusChange({ newStatus, newPaymentStatus, newDeliveryStatus, payments });
      setShowCancelModal(true);
      return;
    }

    onStatusChange({ newStatus, newPaymentStatus, newDeliveryStatus, payments });
  };

  const handleCancelOrderConfirm = (observation: string) => {
    if (pendingStatusChange) {
      const { newStatus, newPaymentStatus, newDeliveryStatus, payments } = pendingStatusChange;
      onStatusChange({
        newStatus,
        newPaymentStatus,
        newDeliveryStatus,
        payments,
        cancellationObservation: observation,
      });
      setPendingStatusChange(null);
    } else {
      onStatusChange({ newStatus: OrderStatus.CANCELLED, cancellationObservation: observation });
    }
    setShowCancelModal(false);
  };

  const itemsSubtotal = useMemo(() => {
    return order.items.reduce((sum, item) => sum + (item.sellingPriceAtSale || 0) * item.quantity, 0);
  }, [order.items]);

  const effectiveDeliveryCost =
    order.deliveryCost !== undefined && order.deliveryCost !== null && order.deliveryCost > 0
      ? order.deliveryCost
      : order.total > itemsSubtotal
        ? order.total - itemsSubtotal
        : 0;

  return (
    <div className="fixed inset-0 bg-stone-950/60 dark:bg-stone-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        {showSuccessModal && (
          <div className="absolute inset-0 z-10 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                if (onCloseSuccessModal) {
                  onCloseSuccessModal();
                }
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer h-10 w-10 flex items-center justify-center"
              aria-label="Close success modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mb-3">¡Qué éxito!</h3>
            <p className="text-sm font-medium text-stone-600 dark:text-stone-300 max-w-sm mb-8 leading-relaxed">
              Ahora tu pedido se ha marcado como completado automáticamente. <br />
              <br />
              ¡Felices ventas, sigue cosechando éxitos! 🚀
            </p>
            <button
              onClick={() => {
                if (onCloseSuccessModal) {
                  onCloseSuccessModal();
                }
              }}
              className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md hover:shadow-lg cursor-pointer"
            >
              ¡Aceptar!
            </button>
          </div>
        )}

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
                  onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                  disabled={isUpdating}
                  aria-label="Change Order Status"
                  className={`appearance-none w-full h-11 pl-3 pr-10 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-stone-900 transition-all cursor-pointer ${getStatusClasses(order.status)}`}
                >
                  <option value={OrderStatus.COMPLETED}>Completed</option>
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
                    handleStatusChange(undefined, val);
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
                  onChange={(e) => handleStatusChange(undefined, undefined, e.target.value as DeliveryStatus)}
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

          {/* Cancellation Observation - only shown when present */}
          {order.cancellationObservation && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">
                    Cancellation Reason
                  </h4>
                  <p className="text-sm text-red-900 dark:text-red-100 leading-relaxed whitespace-pre-wrap">
                    {order.cancellationObservation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {order.paymentStatus === PaymentStatus.PENDING && (
            <PaymentSplitWidget
              totalUSD={order.total}
              onCancel={onClose}
              onSave={async (payments) => {
                await handleStatusChange(undefined, PaymentStatus.PAID, undefined, payments);
              }}
            />
          )}

          {order.paymentStatus === PaymentStatus.PAID && order.payments && order.payments.length > 0 && (
            <PaymentSummaryCard payments={order.payments} accounts={accounts} totalUSD={order.total} />
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

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrderConfirm}
        orderShortId={order._id.substring(18).toUpperCase()}
        isUpdating={isUpdating}
      />
    </div>
  );
};
