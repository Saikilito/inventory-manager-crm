import React from 'react';
import { Plus, Receipt, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from "@utils/formatters";
import Alert from '../../components/Alert';
import ExpenseForm from './ExpenseForm';
import { ExpenseStats } from './components/ExpenseStats';
import { ExpenseFilters } from './components/ExpenseFilters';
import { ExpenseTable } from './components/ExpenseTable';
import { FixedExpensesTab } from './components/FixedExpensesTab';
import { FixedExpenseTemplateModal } from './components/FixedExpenseTemplateModal';
import { IExpense } from '@shared-domain/expense/expense.entity';
import { IFixedExpense } from '@shared-domain/expense/fixed-expense.entity';
import { useExpenseListLogic } from './hooks/useExpenseListLogic';

export const ExpenseList: React.FC = () => {
  const {
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
  } = useExpenseListLogic();

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
