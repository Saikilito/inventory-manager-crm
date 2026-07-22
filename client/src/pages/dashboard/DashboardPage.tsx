import React, { useEffect, useState } from 'react';
import { match } from 'ts-pattern';
import { usePlocState } from '@hooks/use-ploc-state';
import { useDashboardPloc } from '@contexts/dashboard-context';
import { DashboardStateKind } from '@modules/dashboard/presentation/ploc/dashboard-state';
import { useShell } from '@contexts/ShellContext';
import { WelcomeOnboardingModal } from '../../components/dashboard/WelcomeOnboardingModal';
import { useQuery } from '@apollo/client';
import { GET_CONTEXT_METRICS } from '@modules/product/infrastructure/graphql/queries';
import { GET_FIXED_EXPENSE_TEMPLATES } from '../../modules/expense/infrastructure/graphql/fixed-expense';
import { GET_ALL_EXPENSES } from '../../modules/expense/infrastructure/graphql/queries';

// Import our decoupled presentational components
import { DashboardSkeleton } from '../../modules/dashboard/infrastructure/components/DashboardSkeleton';
import { DashboardError } from '../../modules/dashboard/infrastructure/components/DashboardError';
import { KpiMetrics } from '../../modules/dashboard/infrastructure/components/KpiMetrics';
import { InventoryAlerts } from '../../modules/dashboard/infrastructure/components/InventoryAlerts';
import { AiSystemStatus } from '../../modules/dashboard/infrastructure/components/AiSystemStatus';
import { TopClientsChart } from '../../modules/dashboard/infrastructure/components/TopClientsChart';
import { TopSellersChart } from '../../modules/dashboard/infrastructure/components/TopSellersChart';
import { DetailedSummary } from '../../modules/dashboard/infrastructure/components/DetailedSummary';
import { ContextGrid } from './components/ContextGrid';
import { InventoryPotentialCard } from './components/InventoryPotentialCard';
import { BusinessCostCard } from './components/BusinessCostCard';

export const DashboardPage: React.FC = () => {
  const ploc = useDashboardPloc();
  const state = usePlocState(ploc);
  const { theme } = useShell();
  const isDark = theme === 'dark';

  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  // Get real totals from context metrics query
  const { data: metricsData } = useQuery(GET_CONTEXT_METRICS, {
    variables: { contextId: null, period: 'MONTHLY' },
    fetchPolicy: 'cache-and-network',
  });

  const { data: templatesData } = useQuery(GET_FIXED_EXPENSE_TEMPLATES, {
    variables: { contextId: null },
    fetchPolicy: 'cache-and-network',
  });

  const { data: expensesData } = useQuery(GET_ALL_EXPENSES, {
    variables: { limit: 1000, contextId: null },
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    ploc.loadStats();
  }, [ploc]);

  useEffect(() => {
    if (state.kind === DashboardStateKind.LOADED) {
      if (state.topClients.length === 0 && state.topSellers.length === 0) {
        const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding') === 'true';
        if (!hasSeenOnboarding) {
          setIsWelcomeModalOpen(true);
        }
      }
    }
  }, [state]);

  const handleSeedSuccess = () => {
    localStorage.setItem('has_seen_onboarding', 'true');
    setIsWelcomeModalOpen(false);
    ploc.loadStats();
  };

  const handleClose = () => {
    localStorage.setItem('has_seen_onboarding', 'true');
    setIsWelcomeModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {match(state)
        .with({ kind: DashboardStateKind.LOADING }, () => <DashboardSkeleton />)
        .with({ kind: DashboardStateKind.ERROR }, (st) => (
          <DashboardError
            errorMessage={st.errorMessage || 'The dashboard statistics could not be loaded. Please try again.'}
            onRetry={() => ploc.loadStats()}
          />
        ))
        .with({ kind: DashboardStateKind.LOADED }, (st) => {
          // Calculate KPI Metrics using the real data from metrics query if available
          const metrics = metricsData?.getContextMetrics;
          const totalRevenue = metrics?.totalRevenue || 0;

          // Calculate active fixed expenses templates (MOC - Monthly Operating Cost)
          const templates = templatesData?.getFixedExpenseTemplates || [];
          const activeTemplates = templates.filter((t: { isActive: boolean }) => t.isActive);
          const totalFixedExpenses = activeTemplates.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);

          // Calculate non-fixed standard expenses for the current month
          const standardExpensesList = expensesData?.getAllExpenses?.items || [];
          const today = new Date();
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth();

          const currentMonthExpenses = standardExpensesList.filter((e: { createdAt?: string }) => {
            if (!e.createdAt) return false;
            const d = new Date(e.createdAt);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          });

          // Exclude paid fixed expenses from standard list to prevent double counting
          const nonFixedExpenses = currentMonthExpenses.filter(
            (e: { referenceType?: string }) => e.referenceType !== 'FIXED_EXPENSE',
          );
          const totalNonFixedExpenses = nonFixedExpenses.reduce(
            (sum: number, e: { amount: number }) => sum + e.amount,
            0,
          );

          const averageExpenses = totalFixedExpenses + totalNonFixedExpenses;

          // Calculate Ticket Average from Monthly Sales count if available
          let ticketAverage = 0;
          if (metrics && metrics.periods?.monthly && metrics.periods.monthly.length > 0) {
            // Aggregate all sales count across periods to get a global ticket average
            let totalSalesCount = 0;
            metrics.periods.monthly.forEach((p: { salesCount?: number }) => {
              totalSalesCount += p.salesCount || 0;
            });
            if (totalSalesCount > 0) {
              ticketAverage = totalRevenue / totalSalesCount;
            }
          }

          return (
            <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
              {/* Header Title Area */}
              <div>
                <h1 className="text-3xl font-black text-stone-900 dark:text-stone-50 tracking-tight">
                  Dashboard General
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
                  Resumen consolidado de todos tus negocios
                </p>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                {/* Row 1: KPI Metrics Cards */}
                <KpiMetrics
                  totalRevenue={totalRevenue}
                  ticketAverage={ticketAverage}
                  averageExpenses={averageExpenses}
                />

                {/* Row 1.5: Inventory Potential - Ganancia proyectada */}
                <InventoryPotentialCard />

                {/* Row 1.6: Business Cost Metrics - Costo por día y CAC */}
                <BusinessCostCard />

                {/* Row 2: Data Visualizations (Charts) */}
                <TopClientsChart data={st.topClients} isDark={isDark} />
                <TopSellersChart data={st.topSellers} isDark={isDark} />

                {/* Row 2.5: AI System & Inventory Alerts */}
                <InventoryAlerts />
                <AiSystemStatus />

                {/* Row 3: Bento Details */}
                <DetailedSummary topClients={st.topClients} topSellers={st.topSellers} />

                {/* Row 4: Context Grid - Links to Analytics */}
                <ContextGrid />
              </div>
            </div>
          );
        })
        .exhaustive()}
      <WelcomeOnboardingModal isOpen={isWelcomeModalOpen} onClose={handleClose} onSeedSuccess={handleSeedSuccess} />
    </div>
  );
};

export default DashboardPage;
