import React, { useState } from 'react';
import { X, Lock, Landmark } from 'lucide-react';
import { IAccount } from '@shared-domain/financial/account.entity.js';
import { TransactionType } from '@shared-domain/financial/transaction.entity.js';

interface CreateTransactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: {
    accountId: string;
    type: string;
    amount: number;
    description: string;
    referenceId?: string;
  }) => void;
  account: IAccount | null;
  isDayClosed: boolean;
}

export const CreateTransactionDrawer: React.FC<CreateTransactionDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  account,
  isDayClosed,
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.CREDIT); // CREDIT = INCOME, DEBIT = EXPENSE
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !account) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isDayClosed) {
      setError('Cannot record transactions because this financial day is closed / locked.');
      return;
    }

    const amountVal = parseFloat(amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setError('Amount must be a positive number greater than 0');
      return;
    }

    if (type === TransactionType.DEBIT && account.balance < amountVal) {
      setError('Insufficient funds in account for this expense');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    onSubmit({
      accountId: account.id!.toString(),
      type,
      amount: amountVal,
      description: description.trim(),
      referenceId: referenceId.trim() || undefined,
    });

    setAmount('');
    setDescription('');
    setReferenceId('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col justify-between z-50 animate-in slide-in-from-right duration-200">
        <div className="flex-1 flex flex-col min-h-0">
          
          <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-lg font-semibold text-stone-950 dark:text-stone-50">
                  New Ledger Transaction
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Account: <span className="font-semibold text-stone-700 dark:text-stone-300">{account.name.toString()}</span>
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

          <form id="tx-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {isDayClosed && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    Ledger Is Locked
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    This daily session is CLOSED. Transactions cannot be registered or modified.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 text-xs text-red-800 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
                <b>Validation Error:</b> {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Transaction Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isDayClosed}
                  onClick={() => setType(TransactionType.CREDIT)}
                  className={`py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all ${
                    type === TransactionType.CREDIT
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-850'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Income (+)
                </button>
                <button
                  type="button"
                  disabled={isDayClosed}
                  onClick={() => setType(TransactionType.DEBIT)}
                  className={`py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all ${
                    type === TransactionType.DEBIT
                      ? 'border-red-600 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-850'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Expense (-)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Amount ({account.currency.toString()})
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-stone-400 dark:text-stone-500 text-sm font-semibold">
                    {account.currency.toString() === 'USD' ? '$' : 'Bs.'}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isDayClosed}
                  placeholder="0.00"
                  className="block w-full pl-9 pr-3.5 py-3 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-stone-400 dark:placeholder-stone-500 transition-all font-semibold disabled:bg-stone-100 dark:disabled:bg-stone-950/50 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                Current account balance: <span className="font-semibold text-stone-600 dark:text-stone-400">{account.currency.toString() === 'USD' ? '$' : 'Bs.'}{account.balance.toFixed(2)}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isDayClosed}
                placeholder="Write transaction details (e.g., Client payment order #245, Office supplies)"
                rows={3}
                className="block w-full px-3.5 py-2.5 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-stone-400 dark:placeholder-stone-500 transition-all disabled:bg-stone-100 dark:disabled:bg-stone-950/50 disabled:cursor-not-allowed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Reference ID (Optional)
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                disabled={isDayClosed}
                placeholder="e.g., ORD-254, Transfer confirmation #"
                className="block w-full px-3.5 py-2.5 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-stone-400 dark:placeholder-stone-500 transition-all disabled:bg-stone-100 dark:disabled:bg-stone-950/50 disabled:cursor-not-allowed"
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-150 dark:border-stone-850 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all border border-transparent"
          >
            Close
          </button>
          <button
            type="submit"
            form="tx-form"
            disabled={isDayClosed}
            className="h-11 px-6 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 disabled:bg-stone-300 dark:disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isDayClosed ? 'Day Locked' : 'Submit Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};
