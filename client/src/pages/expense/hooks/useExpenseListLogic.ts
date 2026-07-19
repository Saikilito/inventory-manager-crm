import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { match } from 'ts-pattern';
import { usePlocState } from '@hooks/use-ploc-state';
import { useExpensePloc } from '@contexts/expense-context';
import { useFixedExpensePloc } from '@contexts/fixed-expense-context';
import { GET_ALL_CONTEXTS, GET_CONTEXT_METRICS } from '@modules/product/infrastructure/graphql/queries';
import { PRODUCTS_QUERY } from '@modules/product/infrastructure/graphql/queries';
import { GET_USERS } from '@modules/auth/infrastructure/graphql/queries';
import { ExpenseCategory } from '@shared-domain/expense/expense.entity';
import { FixedExpenseChecklistItem } from '@modules/expense/domain/fixed-expense.repository';
import { ExpenseState } from '@modules/expense/presentation/ploc/expense-state';
import { FixedExpenseState } from '@modules/expense/presentation/ploc/fixed-expense-state';
import { MetricsData } from '../components/ExpenseStats';
import { LONG_TOAST_DURATION_MS } from '../../../utils/constants';

const computePeriodDates = (period: string) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (period) {
    case 'Today': {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'Yesterday': {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      start = new Date(yesterday);
      start.setHours(0, 0, 0, 0);
      end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'This Week': {
      const day = now.getDay();
      const diffToMonday = now.getDate() - (day === 0 ? 6 : day - 1);
      start.setDate(diffToMonday);
      start.setHours(0, 0, 0, 0);
      
      end.setDate(diffToMonday + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'Last Week': {
      const day = now.getDay();
      const diffToLastMonday = now.getDate() - (day === 0 ? 6 : day - 1) - 7;
      start.setDate(diffToLastMonday);
      start.setHours(0, 0, 0, 0);
      
      end.setDate(diffToLastMonday + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'This Month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'Last Month': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'Custom':
    default:
      return null;
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
};

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

  // Date range and period states
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const formatDayLabel = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatToInputDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const handlePrevDay = () => {
    setSelectedDay((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNextDay = () => {
    setSelectedDay((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  // Fixed Expense Form States
  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState('UTILITIES');
  const [tplAmount, setTplAmount] = useState('');
  const [tplIsActive, setTplCategoryIsActive] = useState(true);

  // Queries for contexts, products and users
  const { data: contextsData } = useQuery(GET_ALL_CONTEXTS, { fetchPolicy: "cache-and-network" });
  const { data: productsData } = useQuery(PRODUCTS_QUERY, { variables: { limit: 100 } });
  const { data: usersData } = useQuery(GET_USERS);

  // Compute period dates based on selection
  useEffect(() => {
    if (selectedPeriod === 'Custom') {
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
    } else if (selectedPeriod === 'Day') {
      const start = new Date(selectedDay);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDay);
      end.setHours(23, 59, 59, 999);
      setStartDate(start.toISOString());
      setEndDate(end.toISOString());
    } else {
      const computed = computePeriodDates(selectedPeriod);
      if (computed) {
        setStartDate(computed.startDate);
        setEndDate(computed.endDate);
      } else {
        setStartDate('');
        setEndDate('');
      }
    }
  }, [selectedPeriod, customStart, customEnd, selectedDay]);

  // Consolidated metrics query for Egresos dashboard visualization
  const { data: metricsDataRaw, loading: loadingMetrics } = useQuery(GET_CONTEXT_METRICS, {
    variables: {
      contextId: selectedContextId || null,
      startDate: startDate || null,
      endDate: endDate || null,
    },
    fetchPolicy: 'network-only',
  });
  const metricsData = metricsDataRaw as MetricsData | undefined;

  // Load expenses on mount and when filter criteria change
  useEffect(() => {
    ploc.load(state.currentPage, state.limit, selectedContextId, selectedCategory);
  }, [ploc, selectedContextId, selectedCategory, state.currentPage, state.limit]);

  // Load fixed expenses on mount and when context changes
  useEffect(() => {
    fixedPloc.load(undefined, selectedContextId);
  }, [fixedPloc, selectedContextId]);

  // Sync edit form fields when template changes
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

  const toggleChecklistPayment = async (item: FixedExpenseChecklistItem) => {
    if (item.payment?.isPaid) {
      await fixedPloc.unpayFixedExpense(item.fixedExpense.id as string);
    } else {
      await fixedPloc.payFixedExpense(item.fixedExpense.id as string, Number(item.fixedExpense.amount));
    }
  };

  // Safe lookups for names
  const productMap = useMemo(() => {
    const map = new Map<string, string>();
    productsData?.getAllProducts?.forEach((p: { _id: string; name: string }) => map.set(p._id, p.name));
    return map;
  }, [productsData]);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    usersData?.getUsers?.forEach((u: { _id: string; name: string }) => map.set(u._id, u.name));
    return map;
  }, [usersData]);

  const contextMap = useMemo(() => {
    const map = new Map<string, string>();
    contextsData?.getAllContexts?.forEach((c: { _id: string; name: string }) => map.set(c._id, c.name));
    return map;
  }, [contextsData]);

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
    selectedPeriod,
    setSelectedPeriod,
    startDate,
    endDate,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    selectedDay,
    setSelectedDay,
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
    productMap,
    userMap,
    contextMap,
    formatDayLabel,
    formatToInputDate,
    handlePrevDay,
    handleNextDay,
    handlePrevPage,
    handleNextPage,
    handleDelete,
    handleSave,
    handleSaveFixedTemplate,
    handleDeleteFixedTemplate,
    toggleChecklistPayment,
    getCategoryBadgeClass,
    getCategoryLabel
  };
};
