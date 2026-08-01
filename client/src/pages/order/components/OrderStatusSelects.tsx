import { ChevronDown } from 'lucide-react';
import { OrderStatus, PaymentStatus, DeliveryStatus } from '../types';
import { getStatusClasses, getPaymentClasses, getDeliveryClasses } from '../utils/status-styles';
import { DELIVERY_STATUSES } from '@shared-domain/delivery/delivery-status';
import { DELIVERY_STATUS_LABEL, NO_DELIVERY_LABEL } from '../../delivery/delivery-status.presentation';

// CANCELLED is a system/dedicated-action transition (see DeliveriesTable's Cancel
// button), not a user-selectable delivery status here — also avoids colliding with
// the Order Status select's own "Cancelled" option in this same panel.
const SELECTABLE_DELIVERY_STATUSES = DELIVERY_STATUSES.filter((status) => status !== DeliveryStatus.CANCELLED);

interface OrderStatusSelectsProps {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus | null;
  isUpdating: boolean;
  onStatusChange: (newStatus?: OrderStatus, newPaymentStatus?: PaymentStatus, newDeliveryStatus?: DeliveryStatus) => void;
}

export const OrderStatusSelects = ({
  orderStatus,
  paymentStatus,
  deliveryStatus,
  isUpdating,
  onStatusChange,
}: OrderStatusSelectsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50/50 dark:bg-stone-900/40 p-4 rounded-xl border border-stone-100 dark:border-stone-800/80">
      <div className="space-y-1.5 relative">
        <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Order Status
        </label>
        <div className="relative">
          <select
            value={orderStatus}
            onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
            disabled={isUpdating}
            aria-label="Change Order Status"
            className={`appearance-none w-full h-11 pl-3 pr-10 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-stone-900 transition-all cursor-pointer ${getStatusClasses(orderStatus)}`}
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
            value={paymentStatus}
            onChange={(e) => onStatusChange(undefined, e.target.value as PaymentStatus)}
            disabled={isUpdating || orderStatus === OrderStatus.CANCELLED}
            aria-label="Change Payment Status"
            className={`appearance-none w-full h-11 pl-3 pr-10 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-stone-900 transition-all cursor-pointer ${getPaymentClasses(paymentStatus)}`}
          >
            <option value={PaymentStatus.PENDING}>Unpaid</option>
            {paymentStatus === PaymentStatus.PAID && <option value={PaymentStatus.PAID}>Paid</option>}
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
          {deliveryStatus === null ? (
            <div className="w-full h-11 pl-3 pr-10 py-1.5 rounded-xl text-xs font-semibold border bg-stone-50 dark:bg-stone-900/40 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-800/30 flex items-center">
              {NO_DELIVERY_LABEL}
            </div>
          ) : deliveryStatus === DeliveryStatus.CANCELLED ? (
            <div
              className={`w-full h-11 pl-3 pr-10 py-1.5 rounded-xl text-xs font-semibold border flex items-center ${getDeliveryClasses(deliveryStatus)}`}
            >
              {DELIVERY_STATUS_LABEL[deliveryStatus]}
            </div>
          ) : (
            <select
              value={deliveryStatus}
              onChange={(e) => onStatusChange(undefined, undefined, e.target.value as DeliveryStatus)}
              disabled={isUpdating || orderStatus === OrderStatus.CANCELLED}
              aria-label="Change Delivery Status"
              className={`appearance-none w-full h-11 pl-3 pr-10 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-stone-900 transition-all cursor-pointer ${getDeliveryClasses(deliveryStatus)}`}
            >
              {SELECTABLE_DELIVERY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {DELIVERY_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          )}
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
  );
};
