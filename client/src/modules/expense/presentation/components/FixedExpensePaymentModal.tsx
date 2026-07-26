import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { AlertCircle, RefreshCw, Wallet } from 'lucide-react';
import { GET_ACCOUNTS } from '../../../financial/infrastructure/graphql/queries';
import { IFixedExpense } from '@shared-domain/expense/fixed-expense.entity';
import { formatCurrency } from '@utils/formatters';

interface Account {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

interface FixedExpensePaymentModalProps {
  fixedExpense: IFixedExpense;
  onConfirm: (accountId?: string) => Promise<void>;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const FixedExpensePaymentModal: React.FC<FixedExpensePaymentModalProps> = ({
  fixedExpense,
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { data: accountsData, loading: loadingAccounts } = useQuery<{ getAccounts: Account[] }>(
    GET_ACCOUNTS,
    { fetchPolicy: 'no-cache' }
  );

  const accounts = accountsData?.getAccounts || [];

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      const defaultAccount = accounts.find((a) => a.currency === 'USD') || accounts[0];
      if (defaultAccount) {
        setSelectedAccountId(defaultAccount.id || (defaultAccount as any)._id);
      }
    }
  }, [accounts, selectedAccountId]);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm(selectedAccountId || undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl overflow-hidden border border-stone-200 dark:border-stone-800">
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Confirm Payment
          </h3>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg font-bold disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-stone-500 dark:text-stone-400">Fixed Expense</span>
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {fixedExpense.name.toString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-stone-500 dark:text-stone-400">Amount</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(Number(fixedExpense.amount))}
              </span>
            </div>
          </div>

          {loadingAccounts ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
              <span className="text-xs font-semibold text-stone-500">Loading accounts...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-semibold">No financial accounts available</p>
                  <p className="mt-1">Payment will be recorded without a financial transaction.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300">
                Financial Account (Optional)
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={isProcessing}
                className="w-full h-11 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 text-sm font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <option value="">No account (skip transaction)</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency}) - Balance: {formatCurrency(account.balance)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Select an account to create a financial transaction, or leave empty to skip.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <span className="text-xs text-red-700 dark:text-red-400">{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="inline-flex justify-center px-4 py-2 text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="inline-flex justify-center items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 border border-transparent rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
