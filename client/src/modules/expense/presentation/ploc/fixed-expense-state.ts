import { IFixedExpense } from '@shared-domain/expense/fixed-expense.entity.js';
import { FixedExpenseChecklistItem } from '../../domain/fixed-expense.repository.js';

export const FixedExpenseStateKind = {
  LOADING: 'fixed-expense:loading',
  LOADED: 'fixed-expense:loaded',
  ERROR: 'fixed-expense:error',
} as const;

export type FixedExpenseStateKind = typeof FixedExpenseStateKind[keyof typeof FixedExpenseStateKind];

export interface FixedExpenseState {
  kind: FixedExpenseStateKind;
  templates: IFixedExpense[];
  checklist: FixedExpenseChecklistItem[];
  selectedBillingMonth: string;
  contextId: string;
  selectedTemplate?: IFixedExpense;
  showTemplateModal: boolean;
  isSaving: boolean;
  errorMessage?: string;
}

export const fixedExpenseInitialState: FixedExpenseState = {
  kind: FixedExpenseStateKind.LOADING,
  templates: [],
  checklist: [],
  selectedBillingMonth: (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })(),
  contextId: '',
  selectedTemplate: undefined,
  showTemplateModal: false,
  isSaving: false,
  errorMessage: undefined,
};
