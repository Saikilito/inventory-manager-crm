import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_ALL_CONTEXTS } from "@modules/product/infrastructure/graphql/queries";
import { CLIENTS_QUERY } from "@modules/client/infrastructure/graphql/queries";
import { useProfitDetail } from "@modules/dashboard/infrastructure/hooks/useProfitDetail";
import { GroupedOrder } from "../types";

export const useProfitDetailPageLogic = () => {
  const [searchParams] = useSearchParams();
  const period = searchParams.get("period") || "MONTHLY";
  const contextId = searchParams.get("contextId") || "";

  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Fetch Profit Detail data from custom hook
  const { loading, error, summary, transactionLines, refetch } = useProfitDetail();

  // Fetch Contexts for title display
  const { data: contextsData } = useQuery(GET_ALL_CONTEXTS, { fetchPolicy: "cache-first" });
  
  const activeContextName = useMemo(() => {
    if (!contextId) return "General (All Contexts)";
    const contexts = contextsData?.getAllContexts || [];
    const found = contexts.find((c: { _id: string }) => c._id.toString() === contextId);
    return found ? found.name : "Unknown Context";
  }, [contextsData, contextId]);

  // Fetch Clients for Client Name resolution
  const { data: clientsData } = useQuery(CLIENTS_QUERY, {
    variables: { limit: 1000 },
    fetchPolicy: "cache-first",
  });
  
  const clientsMap = useMemo(() => {
    const map = new Map<string, string>();
    const list = clientsData?.getAllClients || [];
    list.forEach((c: { _id: string; firstName: string; lastName: string }) => {
      map.set(c._id.toString(), `${c.firstName} ${c.lastName}`);
    });
    return map;
  }, [clientsData]);

  // Group transaction lines into orders for presentation
  const groupedOrders = useMemo(() => {
    if (!transactionLines || transactionLines.length === 0) return [];

    const ordersMap = new Map<string, GroupedOrder>();

    transactionLines.forEach((line) => {
      const orderId = line.orderId;
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          orderId,
          shortId: orderId.substring(0, 8).toUpperCase(),
          createdAt: line.createdAt,
          clientName: "Unknown Client", // Resolved later
          revenue: 0,
          totalCOGS: 0,
          netProfit: 0,
          marginPct: 0,
          hasFallback: false,
          items: [],
        });
      }

      const orderGroup = ordersMap.get(orderId)!;
      orderGroup.revenue += line.revenue;
      orderGroup.totalCOGS += line.totalCOGS;
      orderGroup.netProfit += line.netMargin;
      
      if (line.isFallback) {
        orderGroup.hasFallback = true;
      }

      orderGroup.items.push({
        productId: line.id.split("-")[1] || "",
        productName: line.productName,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        unitPurchasePrice: line.itemCOGS,
        revenue: line.revenue,
        totalCOGS: line.totalCOGS,
        netMargin: line.netMargin,
        isFallback: line.isFallback,
      });
    });

    const list = Array.from(ordersMap.values());
    list.forEach((order) => {
      order.marginPct = order.revenue > 0 ? (order.netProfit / order.revenue) * 100 : 0;
    });

    return list;
  }, [transactionLines]);

  const resolvedGroupedOrders = useMemo(() => {
    return groupedOrders.map((g) => {
      // Find the clientId from the transaction lines belonging to this order
      const lineWithClientId = transactionLines.find((line) => line.orderId === g.orderId);
      const clientId = lineWithClientId ? lineWithClientId.clientId : "";
      const clientName = clientId ? clientsMap.get(clientId.toString()) || "Unknown Client" : "Unknown Client";
      
      return {
        ...g,
        clientName,
      };
    });
  }, [groupedOrders, transactionLines, clientsMap]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const grossMarginPct = useMemo(() => {
    if (!summary || summary.totalSales === 0) return 0;
    return (summary.grossProfit / summary.totalSales) * 100;
  }, [summary]);

  return {
    period,
    activeContextName,
    loading,
    error,
    summary,
    resolvedGroupedOrders,
    expandedOrders,
    toggleOrder,
    grossMarginPct,
    refetch,
  };
};
