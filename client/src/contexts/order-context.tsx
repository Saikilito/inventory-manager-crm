import { createContext } from '@contexts/ploc-context';
import { OrdersPloc } from '@modules/order/presentation/ploc/order-ploc';

export const [OrdersProvider, useOrdersPloc] = createContext<OrdersPloc>();
