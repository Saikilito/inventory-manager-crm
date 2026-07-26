import { makeDashboardMongooseRepository } from '../../modules/dashboard/infrastructure/repositories/dashboard-mongoose.repository.js';
import { GetTopClients, makeGetTopClients } from '../../modules/dashboard/application/use-cases/get-top-clients.js';
import { GetTopSellers, makeGetTopSellers } from '../../modules/dashboard/application/use-cases/get-top-sellers.js';
import { IDashboardRepository } from '../../modules/dashboard/application/repositories/dashboard.repository.js';

export interface DashboardSubContainer {
  getTopClients: GetTopClients;
  getTopSellers: GetTopSellers;
}

export const buildDashboardModule = (deps: {
  dashboardRepository?: IDashboardRepository;
}): DashboardSubContainer => {
  const dashboardRepository = deps.dashboardRepository ?? makeDashboardMongooseRepository();
  return {
    getTopClients: makeGetTopClients(dashboardRepository),
    getTopSellers: makeGetTopSellers(dashboardRepository),
  };
};
