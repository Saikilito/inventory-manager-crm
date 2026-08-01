import React, { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { OrderStatus, PaymentStatus } from '@shared-domain/order/order.entity';
import { DeliveryStatus } from '@shared-domain/delivery/delivery.entity';
import { OrderDetailModalProps, PaymentSplit } from '../types';
import { X, XCircle } from 'lucide-react';
import Alert from '../../../components/Alert';
import { PaymentSplitWidget } from './PaymentSplitWidget';
import { PaymentSummaryCard } from './PaymentSummaryCard';
import { getFullName, formatDate } from '@utils/formatters';
import { GET_ACCOUNTS } from '@modules/financial/infrastructure/graphql/queries';
import { CancelOrderModal } from './CancelOrderModal';
import { OrderClientInfo } from './OrderClientInfo';
import { OrderStatusSelects } from './OrderStatusSelects';
import { OrderItemsGrid } from './OrderItemsGrid';
import { OrderTotalsFooter } from './OrderTotalsFooter';
import { OrderSuccessModal } from './OrderSuccessModal';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/60 dark:bg-stone-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        {showSuccessModal && (
          <OrderSuccessModal onClose={() => onCloseSuccessModal && onCloseSuccessModal()} />
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
          <OrderClientInfo
            clientId={order.clientId}
            clientName={getClientName(order.clientId)}
            clientAddress={getClientAddress(order.clientId)}
            customDeliveryAddress={order.customDeliveryAddress}
          />

          <OrderStatusSelects
            orderStatus={order.status}
            paymentStatus={order.paymentStatus || PaymentStatus.PENDING}
            deliveryStatus={order.deliveryStatus ?? null}
            isUpdating={isUpdating}
            onStatusChange={handleStatusChange}
          />

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

          <OrderItemsGrid items={order.items} getProductName={getProductName} />
        </div>

        <OrderTotalsFooter orderTotal={order.total} effectiveDeliveryCost={effectiveDeliveryCost} />
      </div>

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
