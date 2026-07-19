import React, { Fragment } from 'react';
import { FinancialStateKind } from '@modules/financial/presentation/ploc/financial-state';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Unlock,
  TrendingUp,
  Landmark,
  Calendar,
  DollarSign,
  AlertCircle,
  HelpCircle,
  FileText,
} from 'lucide-react';
import Spinkit from '@components/Spinkit';
import Alert from '@components/Alert';

// Modals
import { CreateAccountModal } from './components/CreateAccountModal';
import { CreateTransactionDrawer } from './components/CreateTransactionDrawer';
import { ExchangeRateModal } from './components/ExchangeRateModal';
import { TransferFundsDrawer } from './components/TransferFundsDrawer';

// Components
import { AccountsOverview } from './components/AccountsOverview';
import { TransactionJournal } from './components/TransactionJournal';

// Hook
import { useFinancialDashboardLogic } from './hooks/useFinancialDashboardLogic';

export const FinancialDashboardPage: React.FC = () => {
  const {
    state,
    ploc,
    navigate,
    modals,
    search,
    computed,
    handlers,
  } = useFinancialDashboardLogic();

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Day Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-150 dark:border-stone-850 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Landmark className="w-7 h-7 text-emerald-600" />
            Financial Ledger
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Real-time cashflow management, multi-currency accounts, and daily journal sessions.
          </p>
        </div>

        {/* Calendar Picker & Day Arrows */}
        <div className="flex items-center gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-1.5 rounded-2xl shadow-sm self-start">
          <button
            onClick={() => handlers.adjustDate(-1)}
            className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-600 dark:text-stone-400"
            title="Previous Day"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 px-3 font-semibold text-stone-900 dark:text-stone-100">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={state.selectedDate}
              onChange={(e) => ploc.changeDate(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 text-sm p-0 cursor-pointer text-stone-800 dark:text-stone-200"
            />
          </div>

          <button
            onClick={() => handlers.adjustDate(1)}
            className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-600 dark:text-stone-400"
            title="Next Day"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error state display */}
      {state.errorMessage && (
        <div className="mb-6">
          <Alert message={state.errorMessage} type="error" />
        </div>
      )}

      {/* Loading state spinner */}
      {state.kind === FinancialStateKind.LOADING && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Spinkit />
          <p className="text-sm text-stone-500 dark:text-stone-400">Loading daily ledger status...</p>
        </div>
      )}

      {state.kind === FinancialStateKind.LOADED && (
        <Fragment>
          {/* 2. KPI Cards (Combined Balance & Session state) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI 1: Combined Cash on Hand */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Total Cash on Hand (Combined)
                </p>
                <h3 className="text-3xl font-extrabold text-stone-900 dark:text-stone-50">
                  ${computed.combinedBalanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 ml-1.5 uppercase">USD</span>
                </h3>
                <div className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                  <span>In USD Cash: ${computed.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  <span>•</span>
                  <span>In VES Cash: Bs.{computed.totalVES.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 2: Active Exchange Rate */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1">
                  Exchange Rate
                  {!state.activeRate && <span title="No explicit rate set for today, using fallback lookup."><HelpCircle className="w-3.5 h-3.5 text-amber-500" /></span>}
                </p>
                <h3 className="text-3xl font-extrabold text-stone-900 dark:text-stone-50">
                  Bs.{computed.activeRate.toFixed(2)}
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  {!state.activeRate ? 'Fallback rate in effect' : 'Explicit rate set for today'}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => modals.setIsRateModalOpen(true)}
                  disabled={computed.isDayClosed}
                  className="inline-flex items-center justify-center p-2.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-950 dark:hover:bg-stone-850 text-stone-700 dark:text-stone-300 rounded-xl transition-all text-xs font-semibold border border-stone-250 dark:border-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingUp className="w-4 h-4 mr-1 text-emerald-600" />
                  Set Rate
                </button>
              </div>
            </div>

            {/* KPI 3: Daily Session Status */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Journal Session Status
                </p>
                {state.activeDay ? (
                  <div className="flex items-center gap-2">
                    {computed.isDayClosed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-250 dark:border-amber-900/50">
                        <Lock className="w-4 h-4 shrink-0" />
                        Day Locked (Closed)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/50">
                        <Unlock className="w-4 h-4 shrink-0" />
                        Day Open
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-250 dark:border-stone-700">
                    Not Opened
                  </span>
                )}
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  {state.activeDay ? `Opened on ${new Date(state.activeDay.openedAt.toString()).toLocaleTimeString()}` : 'Transactions are disabled'}
                </p>
              </div>

              {computed.isDayOpened ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => navigate(`/finance/arqueo?date=${state.selectedDate}`)}
                    className={`inline-flex items-center justify-center py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      computed.isDayClosed
                        ? 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-850 text-stone-700 dark:text-stone-300'
                        : 'border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-1.5 shrink-0" />
                    {computed.isDayClosed ? 'View Arqueo' : 'Close Session'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => ploc.openDay(state.selectedDate)}
                  className="inline-flex items-center justify-center py-2 px-4 rounded-xl text-xs font-semibold border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition-all"
                >
                  <Unlock className="w-4 h-4 mr-1.5 shrink-0" />
                  Open Session
                </button>
              )}
            </div>
          </div>

          {/* Session unopened mini notice banner */}
          {!computed.isDayOpened && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    La sesión de este día no está abierta
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Las cuentas y saldos se muestran en modo consulta. Para registrar transacciones o modificar tasas, debés abrir la sesión de este día (o se abrirá de manera automática con el primer movimiento).
                  </p>
                </div>
              </div>
              <button
                onClick={() => ploc.openDay(state.selectedDate)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shrink-0"
              >
                <Unlock className="w-4 h-4 mr-1.5" />
                Abrir Sesión
              </button>
            </div>
          )}

          {true && (
            <div className="space-y-8">
              {/* 3. Accounts Overview */}
              <AccountsOverview
                accounts={state.accounts}
                selectedAccountId={state.selectedAccountId}
                activeRate={computed.activeRate}
                isDayClosed={computed.isDayClosed}
                onSelectAccount={handlers.handleSelectAccount}
                onTransferFunds={() => modals.setIsTransferOpen(true)}
                onNewAccount={() => modals.setIsAccountModalOpen(true)}
                onOpenTxDrawer={handlers.handleOpenTxDrawer}
              />

              {/* 4. Transactions List */}
              <TransactionJournal
                selectedAccount={state.accounts.find(a => a.id?.toString() === state.selectedAccountId)}
                transactions={state.selectedAccountId ? (state.transactions[state.selectedAccountId] || []) : []}
                selectedDate={state.selectedDate}
                activeRate={computed.activeRate}
                isDayClosed={computed.isDayClosed}
                searchQuery={search.txSearchQuery}
                onSearchChange={search.setTxSearchQuery}
                onAddTransaction={handlers.handleOpenTxDrawer}
                onDeleteTransaction={handlers.handleDeleteTransaction}
              />
            </div>
          )}
        </Fragment>
      )}

      {/* Account Creation Modal */}
      <CreateAccountModal
        isOpen={modals.isAccountModalOpen}
        onClose={() => modals.setIsAccountModalOpen(false)}
        onSubmit={(name, currency, balance) => ploc.createAccount(name, currency, balance)}
      />

      {/* Rate setting Modal */}
      <ExchangeRateModal
        isOpen={modals.isRateModalOpen}
        onClose={() => modals.setIsRateModalOpen(false)}
        onSubmit={(date, rate) => ploc.updateExchangeRate(date, rate)}
        currentRate={state.activeRate}
        defaultDate={state.selectedDate}
      />

      {/* Transaction Intake form Drawer */}
      <CreateTransactionDrawer
        isOpen={modals.isTxDrawerOpen}
        onClose={() => modals.setIsTxDrawerOpen(false)}
        onSubmit={(input) => ploc.createTransaction(input)}
        account={modals.txDrawerAccount}
        isDayClosed={computed.isDayClosed}
      />

      {/* Transfer Funds Drawer */}
      <TransferFundsDrawer
        isOpen={modals.isTransferOpen}
        onClose={() => modals.setIsTransferOpen(false)}
        onSubmit={(input) => ploc.transferFunds(input)}
        accounts={state.accounts}
        isDayClosed={computed.isDayClosed}
        defaultExchangeRate={state.activeRate}
      />
    </div>
  );
};
