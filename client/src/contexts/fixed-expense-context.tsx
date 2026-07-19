import { createContext } from './ploc-context';
import { FixedExpensePloc } from '@modules/expense/presentation/ploc/fixed-expense-ploc';

export const [FixedExpenseProvider, useFixedExpensePloc] = createContext<FixedExpensePloc>();
