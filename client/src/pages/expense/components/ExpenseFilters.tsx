import React from 'react';
import { Calendar, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { ExpenseCategory } from '@shared-domain/expense/expense.entity';

interface ContextItem {
  _id: string;
  name: string;
}

interface ExpenseFiltersProps {
  // Period filter
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  selectedDay: Date;
  setSelectedDay: (date: Date) => void;
  customStart: string;
  setCustomStart: (val: string) => void;
  customEnd: string;
  setCustomEnd: (val: string) => void;
  handlePrevDay: () => void;
  handleNextDay: () => void;
  
  // Search & Select filters
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedContextId: string;
  setSelectedContextId: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  
  // Data
  contextsData?: { getAllContexts?: ContextItem[] };
  
  // Helpers
  formatDayLabel: (date: Date) => string;
  formatToInputDate: (date: Date) => string;
  getCategoryLabel: (cat: string) => string;
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  selectedPeriod,
  setSelectedPeriod,
  selectedDay,
  setSelectedDay,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  handlePrevDay,
  handleNextDay,
  searchQuery,
  setSearchQuery,
  selectedContextId,
  setSelectedContextId,
  selectedCategory,
  setSelectedCategory,
  contextsData,
  formatDayLabel,
  formatToInputDate,
  getCategoryLabel,
}) => {
  return (
    <>
      {/* Date Range/Period Quick Selector */}
      <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800/60 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Active Period Filter
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {['Today', 'Yesterday', 'Day', 'This Week', 'Last Week', 'This Month', 'Last Month', 'Custom'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 h-9 rounded-lg text-xs font-bold transition-all border ${
                  selectedPeriod === p
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {selectedPeriod === 'Day' && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full shadow-sm px-4 py-1.5 h-10">
              <button
                onClick={handlePrevDay}
                className="p-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors focus:outline-none"
                title="Previous Day"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-sm font-extrabold text-stone-800 dark:text-stone-100 select-none">
                  {formatDayLabel(selectedDay)}
                </span>
              </div>
              <div className="relative flex items-center cursor-pointer text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
                <Calendar className="w-4 h-4" />
                <input
                  type="date"
                  value={formatToInputDate(selectedDay)}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDay(new Date(e.target.value + 'T00:00:00'));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <button
                onClick={handleNextDay}
                className="p-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors focus:outline-none"
                title="Next Day"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {selectedPeriod === 'Custom' && (
          <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
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

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
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

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Context Filter */}
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

          {/* Category Filter */}
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
