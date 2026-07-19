import { IAccount } from '@shared-domain/financial/account.entity.js';
import { ITransaction } from '@shared-domain/financial/transaction.entity.js';
import { IFinancialDay } from '@shared-domain/financial/financial-day.entity.js';
import { DateOnlyVO } from '@shared-domain/shared/value-objects/date-only.vo.js';

export const FinancialStateKind = {
  LOADING: 'financial:loading',
  LOADED: 'financial:loaded',
  ERROR: 'financial:error',
} as const;

export type FinancialStateKind = typeof FinancialStateKind[keyof typeof FinancialStateKind];

export interface FinancialState {
  kind: FinancialStateKind;
  accounts: IAccount[];
  transactions: Record<string, ITransaction[]>; // accountId -> transactions
  activeDay: IFinancialDay | null;
  activeRate: number | null;
  selectedAccountId: string | null;
  errorMessage?: string;
  selectedDate: string; // YYYY-MM-DD
}

export const financialInitialState: FinancialState = {
  kind: FinancialStateKind.LOADING,
  accounts: [],
  transactions: {},
  activeDay: null,
  activeRate: null,
  selectedAccountId: null,
  selectedDate: DateOnlyVO.create().toString(), // Defaults to America/Caracas date
};
