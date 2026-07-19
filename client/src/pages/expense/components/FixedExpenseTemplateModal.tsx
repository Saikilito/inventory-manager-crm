import React from 'react';
import { Settings, AlertCircle, ToggleRight, ToggleLeft } from 'lucide-react';
import { ExpenseCategory } from '@shared-domain/expense/expense.entity';
import { FixedExpenseState } from '@modules/expense/presentation/ploc/fixed-expense-state';

interface FixedExpenseTemplateModalProps {
  fixedState: FixedExpenseState;
  tplName: string;
  setTplName: (val: string) => void;
  tplCategory: string;
  setTplCategory: (val: string) => void;
  tplAmount: string;
  setTplAmount: (val: string) => void;
  tplIsActive: boolean;
  setTplCategoryIsActive: (val: boolean) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
  getCategoryLabel: (cat: string) => string;
}

export const FixedExpenseTemplateModal: React.FC<FixedExpenseTemplateModalProps> = ({
  fixedState,
  tplName,
  setTplName,
  tplCategory,
  setTplCategory,
  tplAmount,
  setTplAmount,
  tplIsActive,
  setTplCategoryIsActive,
  onSave,
  onClose,
  getCategoryLabel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3 mb-4">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-50 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-emerald-600" />
            {fixedState.selectedTemplate ? 'Edit Recurring Template' : 'New Recurring Template'}
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
              Template Name *
            </label>
            <input
              type="text"
              required
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder="e.g. Vercel Hosting, Office Wage..."
              className="w-full h-10 px-3 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-800 dark:text-stone-100 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={tplCategory}
                onChange={(e) => setTplCategory(e.target.value)}
                className="w-full h-10 px-2.5 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-800 dark:text-stone-100 focus:outline-none"
              >
                {Object.values(ExpenseCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={tplAmount}
                onChange={(e) => setTplAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-800 dark:text-stone-100 focus:outline-none tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setTplCategoryIsActive(!tplIsActive)}
              className="focus:outline-none shrink-0"
            >
              {tplIsActive ? (
                <ToggleRight className="w-9 h-9 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-stone-400" />
              )}
            </button>
            <div>
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">Active Status</span>
              <p className="text-[10px] text-stone-400 mt-0.5">Inactive templates do not populate checklist months unless historical.</p>
            </div>
          </div>

          {fixedState.errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200/50 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {fixedState.errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg text-xs font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={fixedState.isSaving}
              className="h-10 px-4 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-all disabled:opacity-50"
            >
              {fixedState.isSaving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
