import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Sparkles,
  Coins,
  Wallet,
} from "lucide-react";
import { formatDate, formatTimeToAmPm } from "@utils/formatters";
import { DeliveryStatus } from "@shared-domain/delivery/delivery.entity";
import { DeliveryShape } from "../hooks/useDeliveriesLogic";
import { DELIVERY_STATUS_LABEL, DELIVERY_STATUS_BADGE_CLASSES } from "../delivery-status.presentation";

interface DeliveriesTableProps {
  filteredDeliveries: DeliveryShape[];
  getClientNameByOrder: (orderId: string) => string;
  handleStatusChange: (id: string, newStatus: string) => void;
}

export const DeliveriesTable: React.FC<DeliveriesTableProps> = ({
  filteredDeliveries,
  getClientNameByOrder,
  handleStatusChange,
}) => {
  const getStatusBadge = (status: DeliveryShape["status"]) => {
    const deliveryStatus = status as DeliveryStatus;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${DELIVERY_STATUS_BADGE_CLASSES[deliveryStatus]}`}
      >
        {DELIVERY_STATUS_LABEL[deliveryStatus]}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredDeliveries.map((delivery) => {
        const clientName = getClientNameByOrder(delivery.orderId);
        const shortId = delivery.id.substring(18).toUpperCase();
        const shortOrderId = delivery.orderId.substring(18).toUpperCase();

        return (
          <div
            key={delivery.id}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-5 border-b border-stone-150 dark:border-stone-850 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/20">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 font-mono tracking-wider">
                  DELIVERY #{shortId}
                </span>
                <span className="block text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                  ORDER #{shortOrderId}
                </span>
              </div>
              {getStatusBadge(delivery.status)}
            </div>

            {/* Delivery Info Body */}
            <div className="p-5 flex-1 space-y-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">{clientName}</span>
              </h3>

              <div className="space-y-2.5 text-xs text-stone-600 dark:text-stone-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>
                    <b>Date:</b> {formatDate(delivery.scheduledDate) || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>
                    <b>Time:</b> {formatTimeToAmPm(delivery.deliveryTime)}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2" title={delivery.address}>
                    <b>Address:</b> {delivery.address}
                  </span>
                </div>
              </div>

              {/* Financial Box */}
              <div className="p-3 bg-stone-50 dark:bg-stone-950/40 rounded-lg border border-stone-150/60 dark:border-stone-850 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
                    <Coins className="w-3.5 h-3.5 text-stone-400" />
                    <span>Delivery Cost</span>
                  </div>
                  <span className="font-bold text-stone-900 dark:text-stone-50">
                    ${delivery.deliveryCost !== undefined ? delivery.deliveryCost.toFixed(2) : "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 shrink-0">
                    <Wallet className="w-3.5 h-3.5 text-stone-400" />
                    <span>Paid to</span>
                  </div>
                  <span className="font-medium text-stone-700 dark:text-stone-300 truncate max-w-[130px]" title={delivery.paymentAccounts?.join(", ")}>
                    {delivery.paymentAccounts && delivery.paymentAccounts.length > 0 ? delivery.paymentAccounts.join(", ") : "None"}
                  </span>
                </div>
              </div>

              {delivery.notes && (
                <div className="flex items-start gap-2 bg-stone-50 dark:bg-stone-950/20 p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
                  <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span className="text-xs line-clamp-2" title={delivery.notes}>
                    <b>Notes:</b> {delivery.notes}
                  </span>
                </div>
              )}
            </div>

            {/* Logistics Status Controls Footer */}
            <div className="p-5 border-t border-stone-100 dark:border-stone-800/80 bg-stone-50/20 dark:bg-stone-950/10 space-y-3">
              <span className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider text-center">
                Change Logistics Status
              </span>
              <div className="grid grid-cols-2 gap-2">
                {delivery.status === DeliveryStatus.PENDING && (
                  <button
                    onClick={() =>
                      handleStatusChange(delivery.id, DeliveryStatus.SENT)
                    }
                    className="h-8 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 border border-amber-200 dark:border-amber-900/30 transition-all cursor-pointer text-center"
                  >
                    Dispatch
                  </button>
                )}
                {(delivery.status === DeliveryStatus.SENT ||
                  delivery.status === DeliveryStatus.PENDING) && (
                  <button
                    onClick={() =>
                      handleStatusChange(delivery.id, DeliveryStatus.DELIVERED)
                    }
                    className={`h-8 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900/30 transition-all cursor-pointer text-center ${delivery.status !== DeliveryStatus.PENDING ? "col-span-2" : ""}`}
                  >
                    Deliver
                  </button>
                )}
                {delivery.status !== DeliveryStatus.DELIVERED &&
                  delivery.status !== DeliveryStatus.CANCELLED && (
                    <button
                      onClick={() =>
                        handleStatusChange(delivery.id, DeliveryStatus.CANCELLED)
                      }
                      className="h-8 rounded-lg text-xs font-semibold text-red-700 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 border border-red-200 dark:border-red-900/30 transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                  )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
