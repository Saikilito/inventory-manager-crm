import React, { useMemo } from "react";
import { match } from "ts-pattern";
import { OrderStatus, PaymentStatus, DeliveryStatus } from "@shared-domain/order/order.entity";
import { Order, OrdersTableProps } from "../types";
import { User, Calendar, Eye, Trash2, CheckCircle2, Clock } from "lucide-react";
import { getFullName } from "@utils/formatters";
import { formatDate, formatCurrency } from "@utils/formatters";

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  clients,
  onViewDetails,
  onDelete,
}) => {
  // O(1) Client lookup map
  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((client) => {
      map.set(client._id, getFullName(client));
    });
    return map;
  }, [clients]);

  const getClientName = (clientId: string): string => {
    return clientMap.get(clientId) || "General Client";
  };

  const getStatusBadge = (status: OrderStatus) => {
    return match(status)
      .with(OrderStatus.ACTIVE, () => (
        <span className="bg-stone-50 dark:bg-stone-900/40 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
          Active
        </span>
      ))
      .with(OrderStatus.CANCELLED, () => (
        <span className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
          Cancelled
        </span>
      ))
      .exhaustive();
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    return match(status)
      .with(PaymentStatus.PENDING, () => (
        <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
          Unpaid
        </span>
      ))
      .with(PaymentStatus.PAID, () => (
        <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Paid
        </span>
      ))
      .with(PaymentStatus.REFUNDED, () => (
        <span className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
          Refunded
        </span>
      ))
      .exhaustive();
  };

  const getDeliveryStatusBadge = (status: DeliveryStatus) => {
    return match(status)
      .with(DeliveryStatus.PENDING, () => (
        <span className="bg-stone-50 dark:bg-stone-900/40 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-800 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
          Pending Deliv.
        </span>
      ))
      .with(DeliveryStatus.SENT, () => (
        <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Sent
        </span>
      ))
      .with(DeliveryStatus.COMPLETE, () => (
        <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Delivered
        </span>
      ))
      .exhaustive();
  };

  return (
    <div className="relative min-h-[200px]">
      <div className="overflow-x-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl shadow-sm mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
              <th
                scope="col"
                className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
              >
                Order ID
              </th>
              <th
                scope="col"
                className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
              >
                Client
              </th>
              <th
                scope="col"
                className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
              >
                Date / Time (Caracas)
              </th>
              <th
                scope="col"
                className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
              >
                Total Invoiced
              </th>
              <th
                scope="col"
                className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
              >
                Status
              </th>
              <th
                scope="col"
                className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {orders.map((order: Order) => {
              const id = order._id;
              const shortId = id.substring(18).toUpperCase();

              return (
                <tr
                  key={id}
                  className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors border-b border-stone-100 dark:border-stone-800/60 last:border-b-0"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-stone-900 dark:text-stone-100 font-mono">
                    #{shortId}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>{getClientName(order.clientId)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>{formatDate(order.createdAt) || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-stone-900 dark:text-stone-100 font-mono">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col sm:flex-row gap-1.5 flex-wrap">
                      {getStatusBadge(order.status)}
                      {getPaymentStatusBadge(order.paymentStatus || 'PENDING')}
                      {getDeliveryStatusBadge(order.deliveryStatus || 'PENDING')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewDetails(order)}
                        className="inline-flex items-center justify-center h-11 px-4 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:bg-stone-300 dark:active:bg-stone-600 transition-colors cursor-pointer"
                        aria-label={`View details for order ${shortId}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Detail
                      </button>
                      <button
                        onClick={() => onDelete(id)}
                        className="inline-flex items-center justify-center h-11 px-4 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/30 transition-colors cursor-pointer"
                        aria-label={`Delete order ${shortId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
