import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useLazyQuery } from '@apollo/client';
import {
  GET_ALL_CONTEXTS,
  GET_CONTEXT_METRICS,
  GET_CONTEXT_REPORT,
} from '@modules/product/infrastructure/graphql/queries';
import { getErrorMessage } from '@utils/error';
import { match } from 'ts-pattern';

export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export const PERIOD_LABELS: Record<PeriodType, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
};

export const getPeriodLabel = (period: string): string => {
  return match(period)
    .with('DAILY', () => 'día anterior')
    .with('WEEKLY', () => 'semana anterior')
    .with('MONTHLY', () => 'mes anterior')
    .otherwise(() => 'período anterior');
};

export interface AnalyticsContext {
  _id: string;
  name: string;
}

export const useAnalyticsLogic = () => {
  const { contextId } = useParams<{ contextId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(
    (searchParams.get('period') as PeriodType) || 'MONTHLY'
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data: contextsData } = useQuery(GET_ALL_CONTEXTS, { fetchPolicy: 'cache-first' });
  const contexts: AnalyticsContext[] = contextsData?.getAllContexts || [];

  const currentContext = useMemo(() => {
    return contexts.find((c) => c._id === contextId);
  }, [contexts, contextId]);

  const { data: metricsData, loading: loadingMetrics, error: metricsError, refetch } = useQuery(
    GET_CONTEXT_METRICS,
    {
      variables: {
        contextId,
        period: selectedPeriod,
      },
      fetchPolicy: 'network-only',
    }
  );

  const metrics = metricsData?.getContextMetrics;

  const [triggerDownloadReport] = useLazyQuery(GET_CONTEXT_REPORT, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    setSearchParams({ period: selectedPeriod });
  }, [selectedPeriod, setSearchParams]);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const { data } = await triggerDownloadReport({
        variables: {
          contextId,
          periodType: selectedPeriod,
        },
      });

      if (data?.getContextReport) {
        const base64Str = data.getContextReport;
        const byteCharacters = atob(base64Str);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `Analytics_${currentContext?.name || 'General'}_${selectedPeriod}.pdf`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        setDownloadError('No se encontró el reporte.');
      }
    } catch (err: unknown) {
      setDownloadError(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const formatStock = (val: number) => {
    return new Intl.NumberFormat('es-DO', {
      maximumFractionDigits: 2,
    }).format(val);
  };

  const totalRevenue = metrics?.totalRevenue || 0;
  const totalCOGS = metrics?.totalCOGS || 0;
  const totalExpenses = metrics?.totalExpenses || 0;
  const netProfit = metrics?.netProfit || 0;
  const investedCapital = metrics?.investedCapital || 0;

  const reinvestment = totalCOGS + investedCapital;
  const revenueTrend = metrics?.revenueTrend;
  const profitTrend = metrics?.profitTrend;
  const expenseTrend = metrics?.expenseTrend;

  const topSellers = metrics?.topSellers || [];
  const accountDistribution = metrics?.accountDistribution || [];
  const favoriteAccountName = metrics?.favoriteAccountName;

  return {
    contextId,
    navigate,
    selectedPeriod,
    setSelectedPeriod,
    downloading,
    downloadError,
    currentContext,
    loadingMetrics,
    metricsError,
    refetch,
    handleDownload,
    formatStock,
    totalRevenue,
    reinvestment,
    netProfit,
    revenueTrend,
    profitTrend,
    expenseTrend,
    topSellers,
    accountDistribution,
    favoriteAccountName,
    totalExpenses,
  };
};
