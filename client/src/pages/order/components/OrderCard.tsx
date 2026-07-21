import React from "react";
import { Package, Eye } from "lucide-react";
import { OrderStatus, PaymentStatus, DeliveryStatus } from "@shared-domain/order/order.entity";
import type { GQLOrder, GQLOrderItem } from "@modules/order/infrastructure/graphql/types";

export type { GQLOrder as Order, GQLOrderItem as OrderItem };

interface OrderCardProps {
  order: GQLOrder;
  client?: { firstName: string; lastName: string };
  contextName?: string;
  formatDate: (d: string) => string;
  formatTime: (d: string) => string;
  onNavigate: () => void;
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/40",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
  ACTIVE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/40",
};

const paymentColors: Record<PaymentStatus, string> = {
  PENDING: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  REFUNDED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const deliveryColors: Record<DeliveryStatus, string> = {
  PENDING: "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300",
  SENT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  COMPLETE: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  client,
  contextName,
  formatDate,
  formatTime,
  onNavigate,
}) => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-mono text-stone-400 dark:text-stone-500 truncate">
            #{order._id.slice(-8).toUpperCase()}
          </p>
          <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">
            {client ? `${client.firstName} ${client.lastName}` : "Unknown Client"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[order.status] || "bg-stone-100 text-stone-600"}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Status Pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${paymentColors[order.paymentStatus] || "bg-stone-100 text-stone-600"}`}>
          {order.paymentStatus}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${deliveryColors[order.deliveryStatus] || "bg-stone-100 text-stone-600"}`}>
          {order.deliveryStatus}
        </span>
        {contextName && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
            {contextName}
          </span>
        )}
      </div>

      {/* Items Count */}
      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-3">
        <Package className="w-3.5 h-3.5" />
        <span>{order.items?.length || 0} items</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
        <span className="text-[11px] text-stone-400 dark:text-stone-500">
          {formatDate(String(order.createdAt))} · {formatTime(String(order.createdAt))}
        </span>
        <button
          onClick={onNavigate}
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/30 transition-colors gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
      </div>
    </div>
  );
};
