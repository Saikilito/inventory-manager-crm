import { createContext } from '@contexts/ploc-context';
import { DashboardPloc } from '@modules/dashboard/presentation/ploc/dashboard-ploc';

export const [DashboardProvider, useDashboardPloc] = createContext<DashboardPloc>();
