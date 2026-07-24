import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Package, Store, ShoppingCart, Plus } from 'lucide-react';

import { GET_ALL_ORDERS } from '@modules/order/infrastructure/graphql/queries';
import { UPDATE_ORDER } from '@modules/order/infrastructure/graphql/mutations';
import { GET_ALL_CONTEXTS, PRODUCTS_QUERY } from '@modules/product/infrastructure/graphql/queries';
import { CLIENTS_QUERY } from '@modules/client/infrastructure/graphql/queries';
import { OrderStatus, PaymentStatus, DeliveryStatus } from '@shared-domain/order/order.entity';
import { DEFAULT_TIMEZONE } from '@shared-domain/shared/value-objects/date-only.vo';
import type { GQLOrder } from '@modules/order/infrastructure/graphql/types';
import type { GQLClient } from '@modules/client/infrastructure/graphql/types';
import type { GQLContext } from '@modules/context/infrastructure/graphql/types';

import Spinkit from '../../components/Spinkit';
import { OrderDetailModal } from './components/OrderDetailModal';
import { ChangeContextModal } from './components/ChangeContextModal';
import { DateNavigator, formatDisplayDateInTimezone } from '../../components/ui/DateNavigator';
import { OrderCard } from './components/OrderCard';
import { OrdersFilters } from './components/OrdersFilters';
import { OrdersPageProps, StatusChangeOptions } from './types';
import { DateOnlyVO } from '@shared-domain/shared/value-objects/date-only.vo';
import { formatDate, formatTime } from '../../utils/formatters';

export const OrdersPage: React.FC<OrdersPageProps> = ({ session }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContextId, setSelectedContextId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(DateOnlyVO.create().toString());

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<GQLOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Context Change Modal State
  const [contextChangeOrder, setContextChangeOrder] = useState<GQLOrder | null>(null);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [contextChangeError, setContextChangeError] = useState<string | null>(null);

  const {
    data: ordersData,
    loading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery(GET_ALL_ORDERS, {
    variables: { limit: 100, date: selectedDate },
    fetchPolicy: 'cache-and-network',
  });

  const { data: contextsData } = useQuery(GET_ALL_CONTEXTS, {
    fetchPolicy: 'cache-first',
  });

  const { data: clientsData } = useQuery(CLIENTS_QUERY, {
    variables: { limit: 1000 },
    fetchPolicy: 'cache-first',
  });

  const { data: productsData } = useQuery(PRODUCTS_QUERY, {
    variables: { limit: 1000 },
    fetchPolicy: 'cache-first',
  });

  const [updateOrder, { loading: isUpdating }] = useMutation(UPDATE_ORDER);

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
    .sort(
      (a: GQLOrder, b: GQLOrder) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime(),
    );

  const ordersByContext = new Map<string, GQLOrder[]>();
  filteredOrders.forEach((order: GQLOrder) => {
    const ctxId = order.contextId || 'general';
    if (!ordersByContext.has(ctxId)) {
      ordersByContext.set(ctxId, []);
    }
    ordersByContext.get(ctxId)!.push(order);
  });

  const handleOpenModal = (order: GQLOrder) => {
    setSelectedOrder(order);
    setUpdateError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = async (options: StatusChangeOptions) => {
    const { newStatus, newPaymentStatus, newDeliveryStatus, payments, newContextId, cancellationObservation } = options;
    if (!selectedOrder) return;

    const previousStatus = selectedOrder.status;

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
        contextId?: string | null;
        payments?: Array<{ accountId: string; amount: number; exchangeRate: number }>;
        cancellationObservation?: string;
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
      if (payments && payments.length > 0) input.payments = payments;

      // Handle contextId change - null means remove context (set to General)
      if (newContextId !== undefined) {
        input.contextId = newContextId;
      } else if (selectedOrder.contextId) {
        input.contextId = selectedOrder.contextId;
      }

      if (cancellationObservation) {
        input.cancellationObservation = cancellationObservation;
      }

      await updateOrder({
        variables: { input },
      });

      const { data: refetchedData } = await refetchOrders();

      const updatedOrder = refetchedData?.getAllOrders?.find((o: GQLOrder) => o._id === selectedOrder._id);
      if (
        updatedOrder &&
        previousStatus !== OrderStatus.COMPLETED &&
        updatedOrder.status === OrderStatus.COMPLETED &&
        newStatus !== OrderStatus.COMPLETED // User didn't explicitly set it to COMPLETED
      ) {
        setShowSuccessModal(true);
        setSelectedOrder(updatedOrder);
      } else if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    } catch (err) {
      const error = err as Error & { graphQLErrors?: Array<{ message: string }> };
      const errorMsg =
        error.graphQLErrors?.[0]?.message ||
        error.message ||
        'Failed to update order. Please check the data and try again.';
      setUpdateError(errorMsg);
      throw err;
    }
  };

  const handleOpenContextModal = (order: GQLOrder) => {
    setContextChangeOrder(order);
    setContextChangeError(null);
    setIsContextModalOpen(true);
  };

  const handleCloseContextModal = () => {
    setIsContextModalOpen(false);
    setContextChangeOrder(null);
    setContextChangeError(null);
  };

  const handleContextChange = async (newContextId: string | null) => {
    if (!contextChangeOrder) return;

    setContextChangeError(null);
    try {
      const input = {
        _id: contextChangeOrder._id,
        clientId: contextChangeOrder.clientId,
        sellerId: contextChangeOrder.sellerId || session._id,
        total: contextChangeOrder.total || 0,
        items: contextChangeOrder.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        contextId: newContextId,
      };

      await updateOrder({
        variables: { input },
      });

      await refetchOrders();
      handleCloseContextModal();
    } catch (err) {
      const error = err as Error & { graphQLErrors?: Array<{ message: string }> };
      const errorMsg =
        error.graphQLErrors?.[0]?.message || error.message || 'Failed to update order context. Please try again.';
      setContextChangeError(errorMsg);
      throw err;
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
      <OrdersFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedContextId={selectedContextId}
        setSelectedContextId={setSelectedContextId}
        contexts={contextsData?.getAllContexts || []}
        onNewOrder={() => navigate('/orders/new')}
      />

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
            onClick={() => navigate('/orders/new')}
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
                      onChangeContext={() => handleOpenContextModal(order)}
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
                  onChangeContext={() => handleOpenContextModal(order)}
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
          products={productsData?.getAllProducts || []}
          isOpen={isModalOpen}
          isUpdating={isUpdating}
          updateError={updateError}
          showSuccessModal={showSuccessModal}
          onClose={handleCloseModal}
          onCloseSuccessModal={() => {
            setShowSuccessModal(false);
            handleCloseModal();
          }}
          onStatusChange={handleStatusChange}
        />
      )}

      {contextChangeOrder && (
        <ChangeContextModal
          order={contextChangeOrder}
          contexts={contextsData?.getAllContexts || []}
          isOpen={isContextModalOpen}
          isUpdating={isUpdating}
          error={contextChangeError}
          onClose={handleCloseContextModal}
          onConfirm={handleContextChange}
        />
      )}
    </div>
  );
};

export default OrdersPage;
