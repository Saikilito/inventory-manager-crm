import React from 'react';
import { Calendar, Search } from 'lucide-react';
import { PeriodType } from '@utils/period-utils';
import { PeriodNavigator } from '../../../components/ui/PeriodNavigator';

interface ContextItem {
  _id: string;
  name: string;
}

interface ExpenseFiltersProps {
  periodType: PeriodType;
  setPeriodType: (type: PeriodType) => void;
  referenceDate: string;
  setReferenceDate: (val: string) => void;
  customStart: string;
  setCustomStart: (val: string) => void;
  customEnd: string;
  setCustomEnd: (val: string) => void;
  isCustomMode: boolean;
  setIsCustomMode: (val: boolean) => void;

  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedContextId: string;
  setSelectedContextId: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;

  contextsData?: { getAllContexts?: ContextItem[] };

  getCategoryLabel: (cat: string) => string;
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  periodType,
  setPeriodType,
  referenceDate,
  setReferenceDate,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  isCustomMode,
  setIsCustomMode,
  searchQuery,
  setSearchQuery,
  selectedContextId,
  setSelectedContextId,
  selectedCategory,
  setSelectedCategory,
  contextsData,
  getCategoryLabel,
}) => {
  return (
    <>
      <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800/60 rounded-xl p-4 mb-6 shadow-sm flex flex-col justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Period Filter
            </span>
            
            <div className="flex flex-wrap gap-1.5">
              {(['day', 'week', 'month'] as PeriodType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setPeriodType(type);
                    setIsCustomMode(false);
                  }}
                  className={`px-3 py-1.5 h-9 rounded-lg text-xs font-bold transition-all border ${
                    !isCustomMode && periodType === type
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
              <button
                onClick={() => setIsCustomMode(true)}
                className={`px-3 py-1.5 h-9 rounded-lg text-xs font-bold transition-all border ${
                  isCustomMode
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {!isCustomMode ? (
            <PeriodNavigator
              periodType={periodType}
              referenceDate={referenceDate}
              onChangeDate={setReferenceDate}
            />
          ) : (
            <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-stone-400 dark:text-stone-500 uppercase">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-9 px-2.5 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-800 dark:text-stone-100 font-semibold focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-stone-400 dark:text-stone-500 uppercase">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-9 px-2.5 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-800 dark:text-stone-100 font-semibold focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-stone-400 dark:text-stone-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by description..."
            className="block w-full pl-10 pr-4 py-2 h-10 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-stone-400 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="h-10 px-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 text-sm font-semibold focus:outline-none"
            value={selectedContextId}
            onChange={(e) => setSelectedContextId(e.target.value)}
          >
            <option value="">All Contexts</option>
            {contextsData?.getAllContexts?.map((ctx: ContextItem) => (
              <option key={ctx._id} value={ctx._id}>
                {ctx.name}
              </option>
            ))}
          </select>

          <select
            className="h-10 px-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-955 text-stone-800 dark:text-stone-100 text-sm font-semibold focus:outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {Object.values(ExpenseCategory).map((cat) => (
              <option key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
};
