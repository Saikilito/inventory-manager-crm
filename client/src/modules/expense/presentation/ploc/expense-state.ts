import { IExpense } from '@shared-domain/expense/expense.entity.js';

export const ExpenseStateKind = {
  LOADING: 'expense:loading',
  LOADED: 'expense:loaded',
  RELOADING: 'expense:reloading',
  ERROR: 'expense:error',
} as const;

export type ExpenseStateKind = typeof ExpenseStateKind[keyof typeof ExpenseStateKind];

export interface CommonExpenseState {
  currentPage: number;
  total: number;
  limit: number;
  contextId: string;
  category: string;
  selectedExpense?: IExpense;
  showFormModal: boolean;
  showDeleteConfirm: boolean;
  isSaving: boolean;
  errorMessage?: string;
}

export interface LoadingExpenseState {
  kind: typeof ExpenseStateKind.LOADING;
}

export interface LoadedExpenseState {
  kind: typeof ExpenseStateKind.LOADED;
  items: IExpense[];
}

export interface ReloadingExpenseState {
  kind: typeof ExpenseStateKind.RELOADING;
  items: IExpense[];
}

export interface ErrorExpenseState {
  kind: typeof ExpenseStateKind.ERROR;
}

export type ExpenseState = (
  | LoadingExpenseState
  | LoadedExpenseState
  | ReloadingExpenseState
  | ErrorExpenseState
) & CommonExpenseState;

export const expenseInitialState: ExpenseState = {
  kind: ExpenseStateKind.LOADING,
  currentPage: 1,
  total: 0,
  limit: 10,
  contextId: '',
  category: '',
  selectedExpense: undefined,
  showFormModal: false,
  showDeleteConfirm: false,
  isSaving: false,
  errorMessage: undefined,
};
