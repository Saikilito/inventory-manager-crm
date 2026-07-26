import React, { useState, useEffect } from 'react';
import { X, Settings2 } from 'lucide-react';
import { IAccount } from '@shared-domain/financial/account.entity.js';

interface AdjustAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: IAccount | null;
  onAdjust: (accountId: string, name: string, balance: number, justification: string) => Promise<void>;
}

export const AdjustAccountModal: React.FC<AdjustAccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onAdjust,
}) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState<number | ''>('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && account) {
      setName(account.name.toString());
      setBalance(account.balance);
      setJustification('');
      setError(null);
    }
  }, [isOpen, account]);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    const numericBalance = Number(balance);
    if (isNaN(numericBalance)) {
      setError('Balance must be a valid number');
      return;
    }

    const balanceChanged = numericBalance !== account.balance;
    if (balanceChanged && !justification.trim()) {
      setError('A justification is required when changing the balance');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAdjust(account.id!.toString(), name, numericBalance, justification);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
              <Settings2 className="w-5 h-5" />
            </div>
            Adjust Account
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Account Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cash USD, Bank Transfer"
                className="w-full px-4 py-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Balance ({account.currency.toString()})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">
                  {account.currency.toString() === 'USD' ? '$' : 'Bs.'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value ? Number(e.target.value) : '')}
                  className="w-full pl-8 pr-4 py-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>
            
            {Number(balance) !== account.balance && (
              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Justification (Required for balance change)
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explain why the balance is being adjusted..."
                  className="w-full px-4 py-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none h-24"
                  required
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adjusting...' : 'Accept'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
