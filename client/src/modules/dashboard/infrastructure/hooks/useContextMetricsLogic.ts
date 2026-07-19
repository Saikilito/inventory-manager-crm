import { useState } from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import {
  GET_ALL_CONTEXTS,
  GET_CONTEXT_METRICS,
  GET_CONTEXT_REPORT,
} from "../../../product/infrastructure/graphql/queries";
import { getErrorMessage } from "@utils/error";

export function useContextMetricsLogic() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("MONTHLY");
  const [selectedContextId, setSelectedContextId] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data: contextsData, loading: loadingContexts } =
    useQuery(GET_ALL_CONTEXTS, { fetchPolicy: "cache-and-network" });
  
  const contexts: Array<{ _id: string; name: string }> = contextsData?.getAllContexts || [];

  const {
    data: metricsData,
    loading: loadingMetrics,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery(GET_CONTEXT_METRICS, {
    variables: {
      contextId: selectedContextId || null,
      period: selectedPeriod,
    },
    fetchPolicy: "network-only",
  });

  const metrics = metricsData?.getContextMetrics;

  const [triggerDownloadReport] = useLazyQuery(GET_CONTEXT_REPORT, {
    fetchPolicy: "network-only",
  });

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const { data } = await triggerDownloadReport({
        variables: {
          contextId: selectedContextId || null,
          periodType: selectedPeriod,
        },
      });

      if (data && data.getContextReport) {
        const base64Str = data.getContextReport;

        // Convert base64 to Blob
        const byteCharacters = atob(base64Str);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        // Trigger browser download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const filename = `Context_Report_${selectedContextId ? "Filtered" : "General"}_${selectedPeriod}.pdf`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        setDownloadError("Report data not found in response.");
      }
    } catch (err: unknown) {
      setDownloadError(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const formatStock = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 4,
    }).format(val);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "DAILY": return "día anterior";
      case "WEEKLY": return "semana anterior";
      case "MONTHLY": return "mes anterior";
      case "QUARTERLY": return "trimestre anterior";
      case "SEMESTRALLY": return "semestre anterior";
      case "ANNUALLY": return "año anterior";
      default: return "período anterior";
    }
  };

  // Safe KPI calculations
  const totalStock: number = metrics?.totalStock || 0;
  const investedCapital: number = metrics?.investedCapital || 0;
  const totalExpenses: number = metrics?.totalExpenses || 0;
  const netProfit: number = metrics?.netProfit || 0;
  const totalRevenue: number = metrics?.totalRevenue || 0;
  const totalCOGS: number = metrics?.totalCOGS || 0;
  
  const revenueTrend: number | null | undefined = metrics?.revenueTrend;
  const profitTrend: number | null | undefined = metrics?.profitTrend;
  const expenseTrend: number | null | undefined = metrics?.expenseTrend;
  
  const accountDistribution: Array<{
    accountId: string;
    accountName: string;
    currency: string;
    totalReceivedUsd: number;
    percentage: number;
  }> = metrics?.accountDistribution || [];
  
  const favoriteAccountName: string | undefined = metrics?.favoriteAccountName;
  
  const topSellers: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    profit?: number;
  }> = (metrics?.topSellers || []).slice(0, 5);

  const cogsPct = totalRevenue > 0 ? (totalCOGS / totalRevenue) * 100 : 0;
  const expensePct = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
  const profitPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    state: {
      selectedPeriod,
      selectedContextId,
      downloading,
      downloadError,
    },
    actions: {
      setSelectedPeriod,
      setSelectedContextId,
      handleDownload,
      refetchMetrics,
    },
    data: {
      contexts,
      loadingContexts,
      loadingMetrics,
      metricsError,
    },
    derived: {
      totalStock,
      investedCapital,
      totalExpenses,
      netProfit,
      totalRevenue,
      totalCOGS,
      revenueTrend,
      profitTrend,
      expenseTrend,
      accountDistribution,
      favoriteAccountName,
      topSellers,
      cogsPct,
      expensePct,
      profitPct,
    },
    utils: {
      formatStock,
      getPeriodLabel,
    }
  };
}
