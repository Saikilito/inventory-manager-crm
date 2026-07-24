import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { match } from 'ts-pattern';
import { usePlocState } from '@hooks/use-ploc-state';
import { useExpensePloc } from '@contexts/expense-context';
import { useFixedExpensePloc } from '@contexts/fixed-expense-context';
import { GET_ALL_CONTEXTS, GET_CONTEXT_METRICS } from '@modules/product/infrastructure/graphql/queries';
import { ExpenseCategory } from '@shared-domain/expense/expense.entity';
import { FixedExpenseChecklistItem } from '@modules/expense/domain/fixed-expense.repository';
import { ExpenseState } from '@modules/expense/presentation/ploc/expense-state';
import { FixedExpenseState } from '@modules/expense/presentation/ploc/fixed-expense-state';
import { MetricsData } from '../components/ExpenseStats';
import { LONG_TOAST_DURATION_MS } from '../../../utils/constants';
import { PeriodType, getPeriodRange, getTodayDateOnly } from '@utils/period-utils';

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

  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [referenceDate, setReferenceDate] = useState<string>(getTodayDateOnly());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState('UTILITIES');
  const [tplAmount, setTplAmount] = useState('');
  const [tplIsActive, setTplCategoryIsActive] = useState(true);

  const { data: contextsData } = useQuery(GET_ALL_CONTEXTS, { fetchPolicy: "cache-and-network" });

  useEffect(() => {
    if (isCustomMode) {
      if (customStart) {
        const start = new Date(customStart + 'T00:00:00');
        setStartDate(start.toISOString());
      } else {
        setStartDate('');
      }
      if (customEnd) {
        const end = new Date(customEnd + 'T23:59:59.999');
        setEndDate(end.toISOString());
      } else {
        setEndDate('');
      }
    } else {
      const range = getPeriodRange(referenceDate, periodType);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  }, [periodType, referenceDate, customStart, customEnd, isCustomMode]);

  const { data: metricsDataRaw, loading: loadingMetrics } = useQuery(GET_CONTEXT_METRICS, {
    variables: {
      contextId: selectedContextId || null,
      startDate: startDate || null,
      endDate: endDate || null,
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

  useEffect(() => {
    if (fixedState && 'selectedTemplate' in fixedState && fixedState.selectedTemplate) {
      setTplName(fixedState.selectedTemplate.name.toString());
      setTplCategory(fixedState.selectedTemplate.category);
      setTplAmount(fixedState.selectedTemplate.amount.toString());
      setTplCategoryIsActive(fixedState.selectedTemplate.isActive);
    } else {
      setTplName('');
      setTplCategory('UTILITIES');
      setTplAmount('');
      setTplCategoryIsActive(true);
    }
  }, [fixedState?.selectedTemplate, fixedState?.showTemplateModal]);

  const handlePrevPage = () => {
    ploc.load(state.currentPage - 1, state.limit, selectedContextId, selectedCategory);
  };

  const handleNextPage = () => {
    ploc.load(state.currentPage + 1, state.limit, selectedContextId, selectedCategory);
  };

  const handleDelete = async (id: string, description: string) => {
    if (window.confirm(`Are you sure you want to delete expense "${description}"?`)) {
      await ploc.confirmDelete(id);
      setSuccessMessage('Expense deleted successfully.');
      setTimeout(() => setSuccessMessage(null), LONG_TOAST_DURATION_MS);
    }
  };

  const handleSave = async (formData: { amount: number; description: string; category: string; contextId?: string; referenceId?: string; referenceType?: string }) => {
    const success = await ploc.save(formData);
    if (success) {
      setSuccessMessage(state.selectedExpense ? 'Expense updated successfully.' : 'Expense created successfully.');
      setTimeout(() => setSuccessMessage(null), LONG_TOAST_DURATION_MS);
    }
  };

  const handleSaveFixedTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName || !tplAmount) {
      alert('Please fill out all required fields');
      return;
    }

    const success = await fixedPloc.saveTemplate({
      name: tplName,
      category: tplCategory,
      amount: Number(tplAmount),
      isActive: tplIsActive,
      contextId: selectedContextId || undefined,
    });

    if (success) {
      setSuccessMessage(fixedState && 'selectedTemplate' in fixedState && fixedState.selectedTemplate ? 'Fixed expense template updated.' : 'Fixed expense template created.');
      setTimeout(() => setSuccessMessage(null), LONG_TOAST_DURATION_MS);
    }
  };

  const handleDeleteFixedTemplate = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the fixed template "${name}"?`)) {
      await fixedPloc.confirmDelete(id);
      setSuccessMessage('Fixed expense template deleted.');
      setTimeout(() => setSuccessMessage(null), LONG_TOAST_DURATION_MS);
    }
  };

  const [pendingToggleItem, setPendingToggleItem] = useState<FixedExpenseChecklistItem | null>(null);

  const requestToggleChecklistPayment = (item: FixedExpenseChecklistItem) => {
    setPendingToggleItem(item);
  };

  const confirmToggleChecklistPayment = async () => {
    if (!pendingToggleItem) return;
    
    if (pendingToggleItem.payment?.isPaid) {
      await fixedPloc.unpayFixedExpense(pendingToggleItem.fixedExpense.id as string);
    } else {
      await fixedPloc.payFixedExpense(pendingToggleItem.fixedExpense.id as string, Number(pendingToggleItem.fixedExpense.amount));
    }
    // Refresh general expenses to reflect the change
    ploc.load(state.currentPage, state.limit, selectedContextId, selectedCategory);
    setPendingToggleItem(null);
  };

  const cancelToggleChecklistPayment = () => {
    setPendingToggleItem(null);
  };

  const toggleChecklistPayment = async (item: FixedExpenseChecklistItem) => {
    // Legacy function, replaced by requestToggleChecklistPayment
    requestToggleChecklistPayment(item);
  };

  const getCategoryBadgeClass = (cat: string) => {
    return match(cat)
      .with(ExpenseCategory.REPLENISHMENT, () => 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/40')
      .with(ExpenseCategory.SALARY, () => 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/40')
      .with(ExpenseCategory.RENT, () => 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/40')
      .with(ExpenseCategory.UTILITIES, () => 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/40')
      .with(ExpenseCategory.MARKETING, () => 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200/50 dark:border-pink-800/40')
      .with(ExpenseCategory.TRANSPORTATION, () => 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300 border-slate-200/50 dark:border-slate-800/40')
      .with(ExpenseCategory.TAX, () => 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200/50 dark:border-red-800/40')
      .otherwise(() => 'bg-stone-100 text-stone-800 dark:bg-stone-800/30 dark:text-stone-300 border-stone-200/50 dark:border-stone-800/40');
  };

  const getCategoryLabel = (cat: string) => {
    return cat.charAt(0) + cat.slice(1).toLowerCase();
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
    periodType,
    setPeriodType,
    referenceDate,
    setReferenceDate,
    startDate,
    endDate,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    isCustomMode,
    setIsCustomMode,
    tplName,
    setTplName,
    tplCategory,
    setTplCategory,
    tplAmount,
    setTplAmount,
    tplIsActive,
    setTplCategoryIsActive,
    contextsData,
    loadingMetrics,
    metricsData,
    handlePrevPage,
    handleNextPage,
    handleDelete,
    handleSave,
    handleSaveFixedTemplate,
    handleDeleteFixedTemplate,
    toggleChecklistPayment,
    pendingToggleItem,
    confirmToggleChecklistPayment,
    cancelToggleChecklistPayment,
    getCategoryBadgeClass,
    getCategoryLabel
  };
};
