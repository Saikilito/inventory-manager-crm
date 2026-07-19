import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ALL_DELIVERIES } from "../../../modules/delivery/infrastructure/graphql/queries";
import { UPDATE_DELIVERY_STATUS } from "../../../modules/delivery/infrastructure/graphql/mutations";
import { CLIENTS_QUERY } from "../../../modules/client/infrastructure/graphql/queries";
import { GET_ALL_ORDERS } from "../../../modules/order/infrastructure/graphql/queries";
import { getErrorMessage } from "@utils/error";
import { getFullName } from "@utils/formatters";
import { DeliveryStatus } from "@shared-domain/delivery/delivery.entity";
import { DateTimeVO } from "@shared-domain/shared/value-objects/date-time.vo";

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
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'DAY' | 'WEEK' | 'MONTH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    DateTimeVO.create().toString().substring(0, 10)
  );

  const {
    data: delData,
    loading: loadingDel,
    refetch: refetchDel,
  } = useQuery(GET_ALL_DELIVERIES, {
    fetchPolicy: "no-cache",
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
    return new Map<string, OrderShape>(orders.map((o: OrderShape) => [o.id, o]));
  }, [orders]);

  const clientMap = useMemo(() => {
    return new Map<string, ClientShape>(clients.map((c: ClientShape) => [c.id, c]));
  }, [clients]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && d.status !== statusFilter) {
        return false;
      }

      // 2. Time Filter
      if (timeFilter === 'ALL') return true;

      const delDate = new Date(d.scheduledDate);
      if (isNaN(delDate.getTime())) return true; // fallback

      const now = new Date();
      
      if (timeFilter === 'DAY') {
        return d.scheduledDate.substring(0, 10) === selectedDate;
      }

      if (timeFilter === 'WEEK') {
        // Current week (Monday to Sunday)
        const day = now.getDay() || 7;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - day + 1);
        startOfWeek.setHours(0,0,0,0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);

        return delDate >= startOfWeek && delDate <= endOfWeek;
      }

      if (timeFilter === 'MONTH') {
        return delDate.getFullYear() === now.getFullYear() && delDate.getMonth() === now.getMonth();
      }

      return true;
    });
  }, [deliveries, statusFilter, timeFilter, selectedDate]);

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
      setSuccessMessage(
        `Delivery successfully updated to ${newStatus.toLowerCase()}.`,
      );
      refetchDel();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      alert(getErrorMessage(err, "Error updating status"));
    }
  };

  const getClientNameByOrder = (orderId: string) => {
    const order = orderMap.get(orderId);
    if (!order) return "General Client";
    const client = clientMap.get(order.clientId);
    return getFullName(client, "General Client");
  };

  const adjustDate = (days: number): void => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const utcTime = Date.UTC(year, month - 1, day);
    const dateObj = new Date(utcTime);
    dateObj.setUTCDate(dateObj.getUTCDate() + days);

    const newYear = dateObj.getUTCFullYear();
    const newMonth = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const newDay = String(dateObj.getUTCDate()).padStart(2, "0");
    const newDateStr = `${newYear}-${newMonth}-${newDay}`;

    const validationResult = DateTimeVO.createResult(newDateStr);
    if (!validationResult.isFailure) {
      setSelectedDate(newDateStr);
    }
  };

  return {
    deliveries,
    filteredDeliveries,
    loadingDel,
    successMessage,
    timeFilter,
    setTimeFilter,
    statusFilter,
    setStatusFilter,
    selectedDate,
    setSelectedDate,
    totalCollected,
    handleStatusChange,
    getClientNameByOrder,
    adjustDate,
  };
};
