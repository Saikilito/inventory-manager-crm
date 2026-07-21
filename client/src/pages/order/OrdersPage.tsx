import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Search, Plus, Filter, Package, Store, ShoppingCart } from 'lucide-react';

import { GET_ALL_ORDERS } from '@modules/order/infrastructure/graphql/queries';
import { UPDATE_ORDER } from '@modules/order/infrastructure/graphql/mutations';
import { GET_ALL_CONTEXTS, PRODUCTS_QUERY } from '@modules/product/infrastructure/graphql/queries';
import { CLIENTS_QUERY } from '@modules/client/infrastructure/graphql/queries';
import { OrderStatus, PaymentStatus, DeliveryStatus } from '@shared-domain/order/order.entity';
import { DateOnlyVO, DEFAULT_TIMEZONE } from '@shared-domain/shared/value-objects/date-only.vo';
import type { GQLOrder } from '@modules/order/infrastructure/graphql/types';
import type { GQLClient } from '@modules/client/infrastructure/graphql/types';
import type { GQLContext } from '@modules/context/infrastructure/graphql/types';

import Spinkit from '../../components/Spinkit';
import { OrderDetailModal } from './components/OrderDetailModal';
import { NewOrderClientModal } from './components/NewOrderClientModal';
import { DateNavigator, formatDisplayDateInTimezone } from '../../components/ui/DateNavigator';
import { OrderCard } from './components/OrderCard';

interface OrdersPageProps {
  session: {
    _id: string;
    role: string;
    name: string;
  };
}

const getTodayDate = (): string => {
  return DateOnlyVO.create().toString();
};

export const OrdersPage: React.FC<OrdersPageProps> = ({ session }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContextId, setSelectedContextId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<GQLOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Fetch Orders with date filter
  const {
    data: ordersData,
    loading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery(GET_ALL_ORDERS, {
    variables: { limit: 100, date: selectedDate },
    fetchPolicy: 'cache-and-network',
  });

  // Fetch Contexts for filter
  const { data: contextsData } = useQuery(GET_ALL_CONTEXTS, {
    fetchPolicy: 'cache-first',
  });

  // Fetch Clients for name resolution
  const { data: clientsData } = useQuery(CLIENTS_QUERY, {
    variables: { limit: 1000 },
    fetchPolicy: 'cache-first',
  });

  // Fetch Products for name resolution in modal
  const { data: productsData } = useQuery(PRODUCTS_QUERY, {
    variables: { limit: 1000 },
    fetchPolicy: 'cache-first',
  });

  // Update Mutation
  const [updateOrder, { loading: isUpdating }] = useMutation(UPDATE_ORDER);

  // Build context map
  const contextMap = new Map<string, string>();
  (contextsData?.getAllContexts || []).forEach((ctx: GQLContext) => {
    contextMap.set(ctx._id, ctx.name);
  });

  const clientMap = new Map<string, { firstName: string; lastName: string }>();
  (clientsData?.getAllClients || []).forEach((c: GQLClient) => {
    clientMap.set(c._id, { firstName: c.firstName, lastName: c.lastName });
  });

  const filteredOrders = (ordersData?.getAllOrders || [])
    .filter((order: GQLOrder) => {
      if (selectedContextId && order.contextId !== selectedContextId) {
        return false;
      }

      if (searchQuery) {
        const term = searchQuery.toLowerCase();
        const client = clientMap.get(order.clientId);
        const clientName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : '';
        const orderId = order._id.toLowerCase();

        return clientName.includes(term) || orderId.includes(term);
      }

      return true;
    })
    .sort((a: GQLOrder, b: GQLOrder) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());

  const ordersByContext = new Map<string, GQLOrder[]>();
  filteredOrders.forEach((order: GQLOrder) => {
    const ctxId = order.contextId || 'general';
    if (!ordersByContext.has(ctxId)) {
      ordersByContext.set(ctxId, []);
    }
    ordersByContext.get(ctxId)!.push(order);
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenModal = (order: GQLOrder) => {
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
  ) => {
    if (!selectedOrder) return;

    setUpdateError(null);
    try {
      const input: {
        _id: string;
        clientId: string;
        sellerId: string;
        total: number;
        items: Array<{ productId: string; quantity: number }>;
        status?: OrderStatus;
        paymentStatus?: PaymentStatus;
        deliveryStatus?: DeliveryStatus;
        contextId?: string;
      } = {
        _id: selectedOrder._id,
        clientId: selectedOrder.clientId,
        sellerId: selectedOrder.sellerId || session._id,
        total: selectedOrder.total || 0,
        items: selectedOrder.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      if (newStatus) input.status = newStatus;
      if (newPaymentStatus) input.paymentStatus = newPaymentStatus;
      if (newDeliveryStatus) input.deliveryStatus = newDeliveryStatus;
      if (selectedOrder.contextId) input.contextId = selectedOrder.contextId;

      await updateOrder({
        variables: { input },
      });

      await refetchOrders();
      handleCloseModal();
    } catch (err) {
      const error = err as Error & { graphQLErrors?: Array<{ message: string }> };
      const errorMsg =
        error.graphQLErrors?.[0]?.message ||
        error.message ||
        'Failed to update order. Please check the data and try again.';
      setUpdateError(errorMsg);
      throw err; // Re-throw so child components know the await failed
    }
  };

  const displayDateStr = formatDisplayDateInTimezone(selectedDate, DEFAULT_TIMEZONE);

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
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">View and manage orders by day.</p>
          </div>
        </div>

        {/* Date Navigation */}
        <DateNavigator selectedDate={selectedDate} onChangeDate={setSelectedDate} />
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
            {(contextsData?.getAllContexts || []).map((ctx: GQLContext) => (
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
        <button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          New Order
        </button>
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
              ? 'No orders found matching the filters.'
              : `No orders for ${displayDateStr.toLowerCase()}.`}
          </p>
          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="inline-flex items-center justify-center mt-4 h-10 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Order count summary */}
          <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <span className="font-medium">{filteredOrders.length}</span>
            <span>order{filteredOrders.length !== 1 ? 's' : ''}</span>
            <span className="text-stone-400 dark:text-stone-500">•</span>
            <span>{displayDateStr}</span>
          </div>

          {/* Show grouped by context or flat list */}
          {selectedContextId === '' ? (
            // Grouped view
            Array.from(ordersByContext.entries()).map(([ctxId, orders]) => (
              <div key={ctxId} className="space-y-3">
                {/* Context Header */}
                <div className="flex items-center gap-2 px-1">
                  <Store className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <h2 className="text-sm font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    {ctxId === 'general' ? 'General (No Context)' : contextMap.get(ctxId) || 'Unknown Context'}
                  </h2>
                  <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
                    ({orders.length} {orders.length === 1 ? 'order' : 'orders'})
                  </span>
                </div>

                {/* Orders in this context */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders.map((order: GQLOrder) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      client={clientMap.get(order.clientId)}
                      contextName={ctxId === 'general' ? undefined : contextMap.get(ctxId)}
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
              {filteredOrders.map((order: GQLOrder) => (
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

      <NewOrderClientModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        clients={clientsData?.getAllClients || []}
      />
    </div>
  );
};

export default OrdersPage;
