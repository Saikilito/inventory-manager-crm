import React, { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';

interface ExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (date: string, rate: number) => void;
  currentRate: number | null;
  defaultDate: string;
}

export const ExchangeRateModal: React.FC<ExchangeRateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentRate,
  defaultDate,
}) => {
  const [rate, setRate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentRate) {
      setRate(currentRate.toString());
    } else {
      setRate('');
    }
  }, [currentRate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rateVal = parseFloat(rate);
    if (isNaN(rateVal) || rateVal <= 0) {
      setError('Exchange rate must be a positive number greater than 0');
      return;
    }

    onSubmit(defaultDate, rateVal);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-stone-950 dark:text-stone-50">
              Set Exchange Rate
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-800 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
              Effective Date
            </label>
            <input
              type="text"
              value={defaultDate}
              disabled
              className="block w-full px-3.5 py-2 text-sm bg-stone-50 dark:bg-stone-950 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-800 rounded-xl cursor-not-allowed font-medium shadow-inner"
            />
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              Exchange rate updates affect transactions recorded on this calendar day.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
              USD to VES Exchange Rate (Bs / $1 USD)
            </label>
            <div className="relative rounded-xl shadow-sm">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g., 45.50"
                className="block w-full px-3.5 py-2.5 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-stone-400 dark:placeholder-stone-500 transition-all font-semibold"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all border border-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
            >
              Update Exchange Rate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
