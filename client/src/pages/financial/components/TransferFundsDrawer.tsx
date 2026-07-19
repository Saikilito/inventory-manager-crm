import React from 'react';
import { X, ArrowLeftRight, Lock, RefreshCw } from 'lucide-react';
import { IAccount } from '@shared-domain/financial/account.entity.js';
import { useTransferFundsLogic } from '../hooks/useTransferFundsLogic.js';

export interface TransferFundsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: {
    sourceAccountId: string;
    targetAccountId: string;
    amount: number;
    targetAmount?: number | null;
    exchangeRate?: number | null;
    description?: string | null;
    date?: string | null;
  }) => void;
  accounts: IAccount[];
  isDayClosed: boolean;
  defaultExchangeRate?: number | null;
}

export const TransferFundsDrawer: React.FC<TransferFundsDrawerProps> = (props) => {
  const { isOpen, onClose, isDayClosed, accounts } = props;

  const { state, handlers } = useTransferFundsLogic(props);
  const {
    sourceAccountId,
    targetAccountId,
    amount,
    exchangeRate,
    targetAmount,
    description,
    error,
    showConversionFields,
    sourceAccount,
    targetAccount,
    targetOptions,
  } = state;
  const {
    handleSourceAccountChange,
    handleTargetAccountChange,
    handleAmountChange,
    handleExchangeRateChange,
    handleTargetAmountChange,
    setDescription,
    handleSubmit,
  } = handlers;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col justify-between z-50 animate-in slide-in-from-right duration-200">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-lg font-semibold text-stone-950 dark:text-stone-50">
                  Transfer Funds
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Move assets between balance accounts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form id="transfer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {isDayClosed && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    Ledger Is Locked
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    This daily session is CLOSED. Fund transfers cannot be registered.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 text-xs text-red-800 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
                <b>Validation Error:</b> {error}
              </div>
            )}

            {/* Source Account Selector */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Source Account
              </label>
              <select
                disabled={isDayClosed}
                value={sourceAccountId}
                onChange={(e) => handleSourceAccountChange(e.target.value)}
                className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-2.5 px-3.5 text-sm text-stone-900 dark:text-stone-100 focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="">Select source account...</option>
                {accounts.map((acc) => (
                  <option key={acc.id!.toString()} value={acc.id!.toString()}>
                    {acc.name.toString()} ({acc.currency.toString()} - Balance: {acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Account Selector */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Target Account
              </label>
              <select
                disabled={isDayClosed || !sourceAccountId}
                value={targetAccountId}
                onChange={(e) => handleTargetAccountChange(e.target.value)}
                className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-2.5 px-3.5 text-sm text-stone-900 dark:text-stone-100 focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select target account...</option>
                {targetOptions.map((acc) => (
                  <option key={acc.id!.toString()} value={acc.id!.toString()}>
                    {acc.name.toString()} ({acc.currency.toString()} - Balance: {acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Source Amount */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Amount to Transfer {sourceAccount && `(${sourceAccount.currency.toString()})`}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  disabled={isDayClosed || !sourceAccountId}
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-2.5 px-3.5 text-sm text-stone-900 dark:text-stone-100 focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {sourceAccount && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400 text-sm font-semibold">
                    {sourceAccount.currency.toString()}
                  </div>
                )}
              </div>
            </div>

            {/* Multi-Currency Conversion Fields */}
            {showConversionFields && targetAccount && (
              <div className="p-4 bg-stone-50 dark:bg-stone-950/40 border border-stone-100 dark:border-stone-800/60 rounded-xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-medium text-xs uppercase tracking-wider">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
                  Currency Conversion
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
                      Exchange Rate
                    </label>
                    <input
                      type="number"
                      step="any"
                      disabled={isDayClosed}
                      value={exchangeRate}
                      onChange={(e) => handleExchangeRateChange(e.target.value)}
                      placeholder="Rate"
                      className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-2.5 px-3.5 text-sm text-stone-900 dark:text-stone-100 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
                      Target Amount ({targetAccount.currency.toString()})
                    </label>
                    <input
                      type="number"
                      step="any"
                      disabled={isDayClosed}
                      value={targetAmount}
                      onChange={(e) => handleTargetAmountChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-2.5 px-3.5 text-sm text-stone-900 dark:text-stone-100 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-stone-400 dark:text-stone-500">
                  {sourceAccount && sourceAccount.currency.toString().toUpperCase() === 'VES' ? (
                    <span>Formula: VES Amount &divide; Rate (VES/USD) = USD Amount</span>
                  ) : (
                    <span>Formula: USD Amount &times; Rate (VES/USD) = VES Amount</span>
                  )}
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Description / Memo (Optional)
              </label>
              <textarea
                disabled={isDayClosed}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Transfer to cash box..."
                rows={3}
                className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-2 px-3.5 text-sm text-stone-900 dark:text-stone-100 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-sm font-semibold border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="transfer-form"
            disabled={isDayClosed}
            className="py-2.5 px-5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Transfer Funds
          </button>
        </div>
      </div>
    </div>
  );
};
