import React, { useEffect, useState } from 'react';
import { match } from 'ts-pattern';
import { usePlocState } from '@hooks/use-ploc-state';
import { useDashboardPloc } from '@contexts/dashboard-context';
import { DashboardStateKind } from '@modules/dashboard/presentation/ploc/dashboard-state';
import { useShell } from '@contexts/ShellContext';
import { WelcomeOnboardingModal } from '../../components/dashboard/WelcomeOnboardingModal';

// Import our decoupled presentational components
import { DashboardSkeleton } from '../../modules/dashboard/infrastructure/components/DashboardSkeleton';
import { DashboardError } from '../../modules/dashboard/infrastructure/components/DashboardError';
import { KpiMetrics } from '../../modules/dashboard/infrastructure/components/KpiMetrics';
import { InventoryAlerts } from '../../modules/dashboard/infrastructure/components/InventoryAlerts';
import { AiSystemStatus } from '../../modules/dashboard/infrastructure/components/AiSystemStatus';
import { TopClientsChart } from '../../modules/dashboard/infrastructure/components/TopClientsChart';
import { TopSellersChart } from '../../modules/dashboard/infrastructure/components/TopSellersChart';
import { DetailedSummary } from '../../modules/dashboard/infrastructure/components/DetailedSummary';

export const DashboardPage: React.FC = () => {
  const ploc = useDashboardPloc();
  const state = usePlocState(ploc);
  const { theme } = useShell();
  const isDark = theme === 'dark';

  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  useEffect(() => {
    ploc.loadStats();
  }, [ploc]);

  useEffect(() => {
    if (state.kind === DashboardStateKind.LOADED) {
      if (state.topClients.length === 0 && state.topSellers.length === 0) {
        setIsWelcomeModalOpen(true);
      }
    }
  }, [state]);

  const handleSeedSuccess = () => {
    setIsWelcomeModalOpen(false);
    ploc.loadStats();
  };

  const handleClose = () => {
    setIsWelcomeModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {match(state)
        .with({ kind: DashboardStateKind.LOADING }, () => <DashboardSkeleton />)
        .with({ kind: DashboardStateKind.ERROR }, (st) => (
          <DashboardError
            errorMessage={st.errorMessage || "The dashboard statistics could not be loaded. Please try again."}
            onRetry={() => ploc.loadStats()}
          />
        ))
        .with({ kind: DashboardStateKind.LOADED }, (st) => {
          // Calculate Dynamic KPI Metrics synchronously during render (Vercel Best Practice 5.1)
          const totalRevenue = st.topClients.reduce((sum, item) => sum + item.total, 0);
          const activeClientsCount = new Set(st.topClients.map((c) => c.clientName)).size;
          const registeredSellersCount = new Set(st.topSellers.map((s) => s.sellerName)).size;
          const maxSale = st.topClients.length > 0 ? Math.max(...st.topClients.map((c) => c.total)) : 0;

          return (
            <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
              {/* Header Title Area */}
              <div>
                <h1 className="text-3xl font-black text-stone-900 dark:text-stone-50 tracking-tight">
                  Analytical Dashboard
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
                  Real-time monitoring of sales, sellers, and inventory.
                </p>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                {/* Row 1: KPI Metrics Cards */}
                <KpiMetrics
                  totalRevenue={totalRevenue}
                  activeClientsCount={activeClientsCount}
                  registeredSellersCount={registeredSellersCount}
                  maxSale={maxSale}
                />

                {/* Row 2: Data Visualizations (Charts) */}
                <TopClientsChart data={st.topClients} isDark={isDark} />
                <TopSellersChart data={st.topSellers} isDark={isDark} />

                {/* Row 2.5: AI System & Inventory Alerts */}
                <InventoryAlerts />
                <AiSystemStatus />

                {/* Row 3: Bento Details */}
                <DetailedSummary topClients={st.topClients} topSellers={st.topSellers} />
              </div>
            </div>
          );
        })
        .exhaustive()}
      <WelcomeOnboardingModal
        isOpen={isWelcomeModalOpen}
        onClose={handleClose}
        onSeedSuccess={handleSeedSuccess}
      />
    </div>
  );
};

export default DashboardPage;
