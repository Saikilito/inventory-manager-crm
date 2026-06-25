import { makePloc, Ploc } from '@modules/shared/presentation/ploc/ploc';
import { dashboardInitialState, DashboardState, DashboardStateKind } from './dashboard-state';
import { GetTopClientsUseCase } from '@modules/dashboard/application/use-cases/get-top-clients';
import { GetTopSellersUseCase } from '@modules/dashboard/application/use-cases/get-top-sellers';

export interface DashboardPloc extends Ploc<DashboardState> {
  loadStats(): Promise<void>;
}

export function makeDashboardPloc(
  getTopClients: GetTopClientsUseCase,
  getTopSellers: GetTopSellersUseCase
): DashboardPloc {
  const ploc = makePloc<DashboardState>(dashboardInitialState);

  const loadStats = async () => {
    ploc.changeState({ kind: DashboardStateKind.LOADING });

    // Load both datasets in parallel to avoid server-side waterfalls
    const [clientsResult, sellersResult] = await Promise.all([
      getTopClients.execute(),
      getTopSellers.execute(),
    ]);

    if (clientsResult.isFailure) {
      const err = clientsResult.getError();
      ploc.changeState({
        kind: DashboardStateKind.ERROR,
        errorMessage: err.message || 'Error loading client statistics',
      });
      return;
    }

    if (sellersResult.isFailure) {
      const err = sellersResult.getError();
      ploc.changeState({
        kind: DashboardStateKind.ERROR,
        errorMessage: err.message || 'Error loading seller statistics',
      });
      return;
    }

    ploc.changeState({
      kind: DashboardStateKind.LOADED,
      topClients: clientsResult.getValue(),
      topSellers: sellersResult.getValue(),
    });
  };

  return {
    ...ploc,
    loadStats,
  };
}
