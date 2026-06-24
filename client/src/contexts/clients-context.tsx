import { createContext } from '@contexts/ploc-context';
import { ClientsPloc } from '@modules/client/presentation/ploc/clients-ploc';

export const [ClientsPlocProvider, useClientsPloc] = createContext<ClientsPloc>();
