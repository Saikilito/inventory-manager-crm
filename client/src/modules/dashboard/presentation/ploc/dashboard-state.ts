import { ITopClient, ITopSeller } from '@modules/dashboard/domain/dashboard.repository';

export const DashboardStateKind = {
  LOADING: 'dashboard:loading',
  LOADED: 'dashboard:loaded',
  ERROR: 'dashboard:error',
} as const;

export type DashboardStateKind = typeof DashboardStateKind[keyof typeof DashboardStateKind];

export interface CommonDashboardState {
  errorMessage?: string;
}

export interface LoadingDashboardState {
  kind: typeof DashboardStateKind.LOADING;
}

export interface LoadedDashboardState {
  kind: typeof DashboardStateKind.LOADED;
  topClients: ITopClient[];
  topSellers: ITopSeller[];
}

export interface ErrorDashboardState {
  kind: typeof DashboardStateKind.ERROR;
  errorMessage: string;
}

export type DashboardState = (
  | LoadingDashboardState
  | LoadedDashboardState
  | ErrorDashboardState
) & CommonDashboardState;

export const dashboardInitialState: DashboardState = {
  kind: DashboardStateKind.LOADING,
};
