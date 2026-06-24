import { createContext } from '@contexts/ploc-context';
import { AuthPloc } from '@modules/auth/presentation/ploc/auth-ploc';

export const [AuthProvider, useAuthPloc] = createContext<AuthPloc>();
