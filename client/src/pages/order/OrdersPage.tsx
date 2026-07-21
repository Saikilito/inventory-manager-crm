import React, { useEffect, useState, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { useQuery, useMutation } from "@apollo/client";
import { 
  Search, 
  Plus, 
  Eye, 
  Filter, 
  Package, 
  Store, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";

import { GET_ALL_ORDERS } from "@modules/order/infrastructure/graphql/queries";
import { UPDATE_ORDER } from "@modules/order/infrastructure/graphql/mutations";
import { GET_ALL_CONTEXTS, PRODUCTS_QUERY } from "@modules/product/infrastructure/graphql/queries";
import { CLIENTS_QUERY } from "@modules/client/infrastructure/graphql/queries";
import { OrderStatus, PaymentStatus, DeliveryStatus } from "@shared-domain/order/order.entity";
import { DateOnlyVO } from "@shared-domain/shared/value-objects/date-only.vo";

import Spinkit from "../../components/Spinkit";
import { OrderDetailModal } from "./components/OrderDetailModal";

interface OrdersPageProps {
  session: {
    _id: string;
    role: string;
    name: string;
  };
}

interface OrderItem {
  productId: string;
  quantity: number;
  sellingPriceAtSale?: number;
  purchasePriceAtSale?: number;
}

interface Order {
  _id: string;
  clientId: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  contextId?: string;
  items: OrderItem[];
  sellerId: string;
  total: number;
}

interface Context {
  _id: string;
  name: string;
}

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  address?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
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

// Get today's date in YYYY-MM-DD format (Local timezone)
const getTodayDate = (): string => {
  return DateOnlyVO.create().toString();
};

// Format date for display
const formatDisplayDate = (dateStr: string): string => {
  // Use UTC boundaries to avoid timezone shifts when displaying
  const parts = dateStr.split('-');
  const date = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
  
  const todayStr = getTodayDate();
  const todayParts = todayStr.split('-');
  const today = new Date(Date.UTC(parseInt(todayParts[0], 10), parseInt(todayParts[1], 10) - 1, parseInt(todayParts[2], 10)));
  
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  if (date.getTime() === today.getTime()) {
    return 'Today';
  } else if (date.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const OrdersPage: React.FC<OrdersPageProps> = ({ session }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContextId, setSelectedContextId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Fetch Orders with date filter
  const { data: ordersData, loading: ordersLoading, refetch: refetchOrders } = useQuery(GET_ALL_ORDERS, {
    variables: { limit: 100, date: selectedDate },
    fetchPolicy: "cache-and-network",
  });

  // Fetch Contexts for filter
  const { data: contextsData } = useQuery(GET_ALL_CONTEXTS, {
    fetchPolicy: "cache-first",
  });

  // Fetch Clients for name resolution
  const { data: clientsData } = useQuery(CLIENTS_QUERY, {
    variables: { limit: 1000 },
    fetchPolicy: "cache-first",
  });

  // Fetch Products for name resolution in modal
  const { data: productsData } = useQuery(PRODUCTS_QUERY, {
    variables: { limit: 1000 },
    fetchPolicy: "cache-first",
  });

  // Update Mutation
  const [updateOrder, { loading: isUpdating }] = useMutation(UPDATE_ORDER);

  // Build context map
  const contextMap = new Map<string, string>();
  (contextsData?.getAllContexts || []).forEach((ctx: Context) => {
    contextMap.set(ctx._id, ctx.name);
  });

  // Build client map
  const clientMap = new Map<string, { firstName: string; lastName: string }>();
  (clientsData?.getAllClients || []).forEach((c: Client) => {
    clientMap.set(c._id, { firstName: c.firstName, lastName: c.lastName });
  });

  // Date navigation helpers
  const adjustDate = (days: number) => {
    const parts = selectedDate.split('-');
    const date = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
    date.setUTCDate(date.getUTCDate() + days);
    
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const handlePrevDay = () => adjustDate(-1);
  const handleNextDay = () => adjustDate(1);

  // Filter orders
  const filteredOrders = (ordersData?.getAllOrders || [])
    .filter((order: Order) => {
      // Filter by context
      if (selectedContextId && order.contextId !== selectedContextId) {
        return false;
      }

      // Filter by search query (client name or order ID)
      if (searchQuery) {
        const term = searchQuery.toLowerCase();
        const client = clientMap.get(order.clientId);
        const clientName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : "";
        const orderId = order._id.toLowerCase();

        return clientName.includes(term) || orderId.includes(term);
      }

      return true;
    })
    .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Group orders by context
  const ordersByContext = new Map<string, Order[]>();
  filteredOrders.forEach((order: Order) => {
    const ctxId = order.contextId || "general";
    if (!ordersByContext.has(ctxId)) {
      ordersByContext.set(ctxId, []);
    }
    ordersByContext.get(ctxId)!.push(order);
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order);
    setUpdateError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = async (
    newStatus?: OrderStatus,
    newPaymentStatus?: PaymentStatus,
    newDeliveryStatus?: DeliveryStatus,
    payments?: Array<{ accountId: string; amount: number; exchangeRate: number }>
  ) => {
    if (!selectedOrder) return;
    
    setUpdateError(null);
    try {
      const input: any = {
        _id: selectedOrder._id,
        clientId: selectedOrder.clientId,
        sellerId: selectedOrder.sellerId,
        total: selectedOrder.total,
        items: selectedOrder.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      if (newStatus) input.status = newStatus;
      if (newPaymentStatus) input.paymentStatus = newPaymentStatus;
      if (newDeliveryStatus) input.deliveryStatus = newDeliveryStatus;
      if (selectedOrder.contextId) input.contextId = selectedOrder.contextId;

      await updateOrder({
        variables: { input }
      });
      
      await refetchOrders();
      handleCloseModal();
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update order");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header with Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              Orders Management
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              View and manage orders by day.
            </p>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={handlePrevDay}
            className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-600 dark:text-stone-400"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-3 font-semibold text-stone-900 dark:text-stone-100">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 text-sm p-0 cursor-pointer text-stone-800 dark:text-stone-200"
            />
            <span className="text-xs text-stone-500 dark:text-stone-400 font-normal">
              ({formatDisplayDate(selectedDate)})
            </span>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-600 dark:text-stone-400"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-stone-400 dark:text-stone-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name or order ID..."
            className="block w-full pl-10 pr-4 py-2 h-10 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-stone-400 dark:placeholder-stone-500 shadow-sm transition-all duration-150"
          />
        </div>

        {/* Context Filter */}
        <div className="relative min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Store className="h-4 w-4 text-stone-400 dark:text-stone-500" />
          </div>
          <select
            value={selectedContextId}
            onChange={(e) => setSelectedContextId(e.target.value)}
            className="block w-full pl-10 pr-8 py-2 h-10 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all duration-150 appearance-none cursor-pointer"
          >
            <option value="">All Contexts</option>
            {(contextsData?.getAllContexts || []).map((ctx: Context) => (
              <option key={ctx._id} value={ctx._id}>
                {ctx.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-stone-400 dark:text-stone-500" />
          </div>
        </div>

        {/* New Order Button */}
        <Link
          to="/clients"
          className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm gap-1.5"
        >
          <Plus className="w-4 h-4 shrink-0" />
          New Order
        </Link>
      </div>

      {/* Orders List */}
      {ordersLoading ? (
        <div className="flex justify-center py-12">
          <Spinkit />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
          <Package className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-4" />
          <p className="text-stone-500 dark:text-stone-400">
            {searchQuery || selectedContextId
              ? "No orders found matching the filters."
              : `No orders for ${formatDisplayDate(selectedDate).toLowerCase()}.`}
          </p>
          <Link
            to="/clients"
            className="inline-flex items-center justify-center mt-4 h-10 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Order count summary */}
          <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <span className="font-medium">{filteredOrders.length}</span>
            <span>order{filteredOrders.length !== 1 ? 's' : ''}</span>
            <span className="text-stone-400 dark:text-stone-500">•</span>
            <span>{formatDisplayDate(selectedDate)}</span>
          </div>

          {/* Show grouped by context or flat list */}
          {selectedContextId === "" ? (
            // Grouped view
            Array.from(ordersByContext.entries()).map(([ctxId, orders]) => (
              <div key={ctxId} className="space-y-3">
                {/* Context Header */}
                <div className="flex items-center gap-2 px-1">
                  <Store className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <h2 className="text-sm font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    {ctxId === "general" ? "General (No Context)" : contextMap.get(ctxId) || "Unknown Context"}
                  </h2>
                  <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
                    ({orders.length} {orders.length === 1 ? "order" : "orders"})
                  </span>
                </div>

                {/* Orders in this context */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders.map((order: Order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      client={clientMap.get(order.clientId)}
                      contextName={ctxId === "general" ? undefined : contextMap.get(ctxId)}
                      formatDate={formatDate}
                  formatTime={formatTime}
                  onNavigate={() => handleOpenModal(order)}
                />
              ))}
                </div>
              </div>
            ))
          ) : (
            // Flat list for filtered context
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order: Order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  client={clientMap.get(order.clientId)}
                  contextName={contextMap.get(selectedContextId)}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  onNavigate={() => handleOpenModal(order)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          clients={clientsData?.getAllClients || []}
          products={productsData?.getProducts || []}
          isOpen={isModalOpen}
          isUpdating={isUpdating}
          updateError={updateError}
          onClose={handleCloseModal}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

// Order Card Component
interface OrderCardProps {
  order: Order;
  client?: { firstName: string; lastName: string };
  contextName?: string;
  formatDate: (d: string) => string;
  formatTime: (d: string) => string;
  onNavigate: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
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
          {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
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

export default OrdersPage;
