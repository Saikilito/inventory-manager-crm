import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { match } from 'ts-pattern';
import { usePlocState } from '@hooks/use-ploc-state';
import { useExpensePloc } from '@contexts/expense-context';
import { useFixedExpensePloc } from '@contexts/fixed-expense-context';
import { GET_ALL_CONTEXTS, GET_CONTEXT_METRICS } from '@modules/product/infrastructure/graphql/queries';
import { PRODUCTS_QUERY } from '@modules/product/infrastructure/graphql/queries';
import { GET_USERS } from '@modules/auth/infrastructure/graphql/queries';
import { Plus, Receipt, AlertCircle } from 'lucide-react';
import { ExpenseCategory } from '@shared-domain/expense/expense.entity';
import { formatCurrency, formatDate } from "@utils/formatters";
import { LONG_TOAST_DURATION_MS } from "../../utils/constants";
import Alert from '../../components/Alert';
import ExpenseForm from './ExpenseForm';
import { ExpenseStats, MetricsData } from './components/ExpenseStats';
import { ExpenseFilters } from './components/ExpenseFilters';
import { ExpenseTable } from './components/ExpenseTable';
import { FixedExpensesTab } from './components/FixedExpensesTab';
import { FixedExpenseTemplateModal } from './components/FixedExpenseTemplateModal';
import { IExpense } from '@shared-domain/expense/expense.entity';
import { IFixedExpense } from '@shared-domain/expense/fixed-expense.entity';
import { FixedExpenseChecklistItem } from '@modules/expense/domain/fixed-expense.repository';

// We must explicitly type state to satisfy TypeScript
import { ExpenseState } from '@modules/expense/presentation/ploc/expense-state';
import { FixedExpenseState } from '@modules/expense/presentation/ploc/fixed-expense-state';

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

export const ExpenseList: React.FC = () => {
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

  return (
    <div className="w-full">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Expenses Ledger
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Track, manage, and audit regular operational expenses and recurring fixed templates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stone-style Tab bar */}
          <div className="flex bg-stone-100 dark:bg-stone-800/60 p-1 rounded-lg border border-stone-200/40 dark:border-stone-700/30">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'general'
                  ? 'bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              General Expenses
            </button>
            <button
              onClick={() => setActiveTab('fixed')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'fixed'
                  ? 'bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Fixed Expenses (Checklist)
            </button>
          </div>

          {activeTab === 'general' ? (
            <button
              onClick={() => ploc.openCreate()}
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Expense
            </button>
          ) : (
            <button
              onClick={() => fixedPloc.openCreate()}
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Template
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="mb-6">
          <Alert message={successMessage} type="success" />
        </div>
      )}

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'general' ? (
        <>
          <ExpenseFilters 
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
            handlePrevDay={handlePrevDay}
            handleNextDay={handleNextDay}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedContextId={selectedContextId}
            setSelectedContextId={setSelectedContextId}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            contextsData={contextsData}
            formatDayLabel={formatDayLabel}
            formatToInputDate={formatToInputDate}
            getCategoryLabel={getCategoryLabel}
          />

          <ExpenseStats 
            selectedPeriod={selectedPeriod}
            loadingMetrics={loadingMetrics}
            metricsData={metricsData}
          />

          <ExpenseTable 
            state={state}
            searchQuery={searchQuery}
            startDate={startDate}
            endDate={endDate}
            contextMap={contextMap}
            productMap={productMap}
            userMap={userMap}
            getCategoryBadgeClass={getCategoryBadgeClass}
            getCategoryLabel={getCategoryLabel}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onEdit={(expense: IExpense) => ploc.openEdit(expense)}
            onDelete={handleDelete}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
          />
        </>
      ) : activeTab === 'fixed' ? (
        <FixedExpensesTab 
          fixedState={fixedState}
          onChangeBillingMonth={(month) => fixedPloc.changeBillingMonth(month)}
          toggleChecklistPayment={toggleChecklistPayment}
          getCategoryBadgeClass={getCategoryBadgeClass}
          getCategoryLabel={getCategoryLabel}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          onEditTemplate={(tpl: IFixedExpense) => fixedPloc.openEdit(tpl)}
          onDeleteTemplate={handleDeleteFixedTemplate}
        />
      ) : null}

      {/* Slide-over/Modal Form for General Expense */}
      {state.showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-xl overflow-hidden border border-stone-200 dark:border-stone-800">
            <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                {state.selectedExpense ? 'Edit Expense' : 'Create New Expense'}
              </h3>
              <button
                onClick={() => ploc.closeForm()}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto p-2">
              <ExpenseForm
                expense={state.selectedExpense}
                onSubmit={handleSave}
                onCancel={() => ploc.closeForm()}
                isSaving={state.isSaving}
              />
            </div>
            {state.errorMessage && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border-t border-rose-100 dark:border-rose-900/30 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {state.errorMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Form for Recurring Expense Template */}
      {fixedState.showTemplateModal && (
        <FixedExpenseTemplateModal 
          fixedState={fixedState}
          tplName={tplName}
          setTplName={setTplName}
          tplCategory={tplCategory}
          setTplCategory={setTplCategory}
          tplAmount={tplAmount}
          setTplAmount={setTplAmount}
          tplIsActive={tplIsActive}
          setTplCategoryIsActive={setTplCategoryIsActive}
          onSave={handleSaveFixedTemplate}
          onClose={() => fixedPloc.closeTemplateModal()}
          getCategoryLabel={getCategoryLabel}
        />
      )}
    </div>
  );
};

export default ExpenseList;
