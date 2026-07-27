import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ALL_DELIVERIES } from '../../../modules/delivery/infrastructure/graphql/queries';
import { UPDATE_DELIVERY_STATUS } from '../../../modules/delivery/infrastructure/graphql/mutations';
import { CLIENTS_QUERY } from '../../../modules/client/infrastructure/graphql/queries';
import { GET_ALL_ORDERS } from '../../../modules/order/infrastructure/graphql/queries';
import { getErrorMessage } from '@utils/error';
import { getFullName } from '@utils/formatters';
import { toDateOnlyString } from '@utils/period-utils';
import { DeliveryStatus } from '@shared-domain/delivery/delivery.entity';
import { DateTimeVO } from '@shared-domain/shared/value-objects/date-time.vo';

export interface ClientShape {
  id: string;
  firstName: string;
  lastName: string;
}

export interface OrderShape {
  id: string;
  clientId: string;
}

export interface DeliveryShape {
  id: string;
  orderId: string;
  scheduledDate: string;
  deliveryTime: string;
  address: string;
  status: string;
  notes?: string;
  deliveryCost?: number;
  paymentAccounts?: string[];
}

export const useDeliveriesLogic = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateOnlyString(DateTimeVO.create().toString()));

  const {
    data: delData,
    loading: loadingDel,
    refetch: refetchDel,
  } = useQuery(GET_ALL_DELIVERIES, {
    fetchPolicy: 'no-cache',
  });

  const deliveries: DeliveryShape[] = delData?.getAllDeliveries || [];

  const { data: ordersData } = useQuery(GET_ALL_ORDERS, {
    variables: { limit: 1000 },
  });

  const orders: OrderShape[] = ordersData?.getAllOrders || [];
  const { data: clientsData } = useQuery(CLIENTS_QUERY, {
    variables: { limit: 1000 },
  });
  const clients: ClientShape[] = clientsData?.getAllClients || [];

  const orderMap = useMemo(() => {
    return new Map<string, OrderShape>(
      orders.map((o: OrderShape & { _id?: string }) => [o.id || o._id || '', o])
    );
  }, [orders]);

  const clientMap = useMemo(() => {
    return new Map<string, ClientShape>(
      clients.map((c: ClientShape & { _id?: string }) => [c.id || c._id || '', c])
    );
  }, [clients]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      if (!orderMap.has(d.orderId)) {
        return false;
      }

      if (statusFilter !== 'ALL' && d.status !== statusFilter) {
        return false;
      }

      return toDateOnlyString(d.scheduledDate) === selectedDate;
    });
  }, [deliveries, orderMap, statusFilter, selectedDate]);

  const totalCollected = useMemo(() => {
    return filteredDeliveries
      .filter((d) => d.status !== DeliveryStatus.CANCELLED)
      .reduce((sum, d) => sum + (d.deliveryCost || 0), 0);
  }, [filteredDeliveries]);

  const [updateStatus] = useMutation(UPDATE_DELIVERY_STATUS);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus({
        variables: { id, status: newStatus },
      });
      setSuccessMessage(`Delivery successfully updated to ${newStatus.toLowerCase()}.`);
      refetchDel();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      alert(getErrorMessage(err, 'Error updating status'));
    }
  };

  const getClientNameByOrder = (orderId: string) => {
    const order = orderMap.get(orderId);
    if (!order) return 'General Client';
    const client = clientMap.get(order.clientId);
    return getFullName(client, 'General Client');
  };

  return {
    deliveries,
    filteredDeliveries,
    loadingDel,
    successMessage,
    statusFilter,
    setStatusFilter,
    selectedDate,
    setSelectedDate,
    totalCollected,
    handleStatusChange,
    getClientNameByOrder,
  };
};
