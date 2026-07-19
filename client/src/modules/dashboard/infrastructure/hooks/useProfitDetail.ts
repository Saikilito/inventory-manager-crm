import { useQuery } from "@apollo/client";
import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { GET_CONTEXT_METRICS, PRODUCTS_QUERY } from "@modules/product/infrastructure/graphql/queries";
import { GET_ALL_ORDERS } from "@modules/order/infrastructure/graphql/queries";
import { parsePeriodToDateRange } from "../utils/period";
import { calculateTransactionLines, TransactionLine, ProfitDetailSummary } from "../utils/aggregation";

export interface UseProfitDetailResult {
  loading: boolean;
  error: Error | null;
  summary: ProfitDetailSummary | null;
  transactionLines: TransactionLine[];
  refetch: () => Promise<unknown>;
}

export const useProfitDetail = (): UseProfitDetailResult => {
  const [searchParams] = useSearchParams();
  const period = searchParams.get("period") || "MONTHLY";
  const contextId = searchParams.get("contextId") || "";

  // 1. Get date range for order filtering
  const { startDate, endDate } = useMemo(() => {
    return parsePeriodToDateRange(period);
  }, [period]);

  // 2. Query Context Metrics (Server-side ground truth)
  const {
    data: metricsData,
    loading: loadingMetrics,
    error: errorMetrics,
    refetch: refetchMetrics,
  } = useQuery(GET_CONTEXT_METRICS, {
    variables: {
      contextId: contextId || null,
      period: period,
    },
    fetchPolicy: "network-only",
  });

  // 3. Query All Orders in date range
  const {
    data: ordersData,
    loading: loadingOrders,
    error: errorOrders,
    refetch: refetchOrders,
  } = useQuery(GET_ALL_ORDERS, {
    variables: {
      startDate,
      endDate,
      limit: 100000,
    },
    fetchPolicy: "network-only",
  });

  // 4. Query All Products for catalog COGS fallback
  const {
    data: productsData,
    loading: loadingProducts,
    refetch: refetchProducts,
  } = useQuery(PRODUCTS_QUERY, {
    variables: {
      limit: 100000,
    },
    fetchPolicy: "cache-first",
  });

  const loading = loadingMetrics || loadingOrders || loadingProducts;
  const error = errorMetrics || errorOrders || null;

  const result = useMemo(() => {
    if (loading || error) {
      return { summary: null, transactionLines: [] };
    }

    const allProducts = productsData?.getAllProducts || [];
    const allOrders = ordersData?.getAllOrders || [];
    const serverMetrics = metricsData?.getContextMetrics;

    // Build product map and context product sets
    const productsMap = new Map<string, { name: string; price: number; cost: number; category: string; [key: string]: unknown }>();
    const contextProductIds = contextId ? new Set<string>() : null;

    allProducts.forEach((p: { _id: string; name: string; price: number; cost: number; category: string; contextId?: string }) => {
      productsMap.set(p._id.toString(), p);
      if (contextId && p.contextId === contextId) {
        contextProductIds?.add(p._id.toString());
      }
    });

    // Compute transaction lines
    const transactionLines = calculateTransactionLines(allOrders, productsMap, contextProductIds);

    // Calculate aggregated summary
    let totalSales = 0;
    let totalCOGS = 0;
    let fallbackCount = 0;

    transactionLines.forEach((line) => {
      totalSales += line.revenue;
      totalCOGS += line.totalCOGS;
      if (line.isFallback) {
        fallbackCount++;
      }
    });

    const grossProfit = totalSales - totalCOGS;
    const totalExpenses = serverMetrics?.totalExpenses || 0;
    const calculatedNetProfit = grossProfit - totalExpenses;
    const serverNetProfit = serverMetrics?.netProfit || 0;
    const discrepancy = calculatedNetProfit - serverNetProfit;

    // Reconciliation allows +/- 0.05 cent/decimal rounding tolerance
    const isReconciled = Math.abs(discrepancy) < 0.05;

    const summary: ProfitDetailSummary = {
      totalSales: Number(totalSales.toFixed(2)),
      totalCOGS: Number(totalCOGS.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      calculatedNetProfit: Number(calculatedNetProfit.toFixed(2)),
      serverNetProfit: Number(serverNetProfit.toFixed(2)),
      discrepancy: Number(discrepancy.toFixed(2)),
      isReconciled,
      fallbackCount,
    };

    return {
      summary,
      transactionLines,
    };
  }, [loading, error, productsData, ordersData, metricsData, contextId]);

  const refetch = async () => {
    await Promise.all([
      refetchMetrics().catch(() => {}),
      refetchOrders().catch(() => {}),
      refetchProducts().catch(() => {}),
    ]);
  };

  return {
    loading,
    error,
    summary: result.summary,
    transactionLines: result.transactionLines,
    refetch,
  };
};
