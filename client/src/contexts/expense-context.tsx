import { createContext } from './ploc-context';
import { ExpensePloc } from '@modules/expense/presentation/ploc/expense-ploc';

export const [ExpenseProvider, useExpensePloc] = createContext<ExpensePloc>();
