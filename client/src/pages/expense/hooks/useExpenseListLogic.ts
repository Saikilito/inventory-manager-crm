import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { usePlocState } from '@hooks/use-ploc-state';
import { useExpensePloc } from '@contexts/expense-context';
import { useFixedExpensePloc } from '@contexts/fixed-expense-context';
import { GET_ALL_CONTEXTS, GET_CONTEXT_METRICS } from '@modules/product/infrastructure/graphql/queries';
import { ExpenseState } from '@modules/expense/presentation/ploc/expense-state';
import { FixedExpenseState } from '@modules/expense/presentation/ploc/fixed-expense-state';
import { MetricsData } from '../components/ExpenseStats';
import { LONG_TOAST_DURATION_MS } from '../../../utils/constants';

import { useExpenseDateRange } from './useExpenseDateRange';
import { useFixedExpenseTemplateForm } from './useFixedExpenseTemplateForm';
import { useChecklistPayment } from './useChecklistPayment';
import { getCategoryBadgeClass, getCategoryLabel } from '../utils/expenseCategoryPresenter';

export const useExpenseListLogic = () => {
  const ploc = useExpensePloc();
  const state = usePlocState(ploc) as ExpenseState;

  const fixedPloc = useFixedExpensePloc();
  const fixedState = usePlocState(fixedPloc) as FixedExpenseState;

  const [activeTab, setActiveTab] = useState<'general' | 'fixed'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContextId, setSelectedContextId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dateRange = useExpenseDateRange();

  const notifySuccess = useCallback((msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), LONG_TOAST_DURATION_MS);
  }, []);

  const { data: contextsData } = useQuery(GET_ALL_CONTEXTS, { fetchPolicy: 'cache-and-network' });

  const { data: metricsDataRaw, loading: loadingMetrics } = useQuery(GET_CONTEXT_METRICS, {
    variables: {
      contextId: selectedContextId || null,
      startDate: dateRange.startDate || null,
      endDate: dateRange.endDate || null,
    },
    fetchPolicy: 'network-only',
  });
  const metricsData = metricsDataRaw as MetricsData | undefined;

  useEffect(() => {
    ploc.load(state.currentPage, state.limit, selectedContextId, selectedCategory);
  }, [ploc, selectedContextId, selectedCategory, state.currentPage, state.limit]);

  useEffect(() => {
    fixedPloc.load(undefined, selectedContextId);
  }, [fixedPloc, selectedContextId]);

  const templateForm = useFixedExpenseTemplateForm(fixedState, fixedPloc, selectedContextId, notifySuccess);

  const checklistPayment = useChecklistPayment(fixedPloc, ploc, state, selectedContextId, selectedCategory);

  const handlePrevPage = () => {
    ploc.load(state.currentPage - 1, state.limit, selectedContextId, selectedCategory);
  };

  const handleNextPage = () => {
    ploc.load(state.currentPage + 1, state.limit, selectedContextId, selectedCategory);
  };

  const handleDelete = async (id: string, description: string) => {
    if (window.confirm(`Are you sure you want to delete expense "${description}"?`)) {
      await ploc.confirmDelete(id);
      await fixedPloc.load(undefined, selectedContextId);
      notifySuccess('Expense deleted successfully.');
    }
  };

  const handleSave = async (formData: {
    amount: number;
    description: string;
    category: string;
    contextId?: string;
    referenceId?: string;
    referenceType?: string;
    accountId?: string;
  }) => {
    const success = await ploc.save(formData);
    if (success) {
      await fixedPloc.load(undefined, selectedContextId);
      notifySuccess(state.selectedExpense ? 'Expense updated successfully.' : 'Expense created successfully.');
    }
  };

  return {
    state,
    fixedState,
    ploc,
    fixedPloc,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedContextId,
    setSelectedContextId,
    selectedCategory,
    setSelectedCategory,
    successMessage,
    ...dateRange,
    ...templateForm,
    ...checklistPayment,
    contextsData,
    loadingMetrics,
    metricsData,
    handlePrevPage,
    handleNextPage,
    handleDelete,
    handleSave,
    getCategoryBadgeClass,
    getCategoryLabel,
  };
};
