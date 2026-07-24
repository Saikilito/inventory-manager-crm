import React from "react";
import { Search, Filter } from "lucide-react";
import type { GQLContext } from "@modules/context/infrastructure/graphql/types";

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedContextId: string | null;
  onContextChange: (contextId: string | null) => void;
  contexts: GQLContext[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedContextId,
  onContextChange,
  contexts,
}) => {
  const handleContextSelect = (value: string) => {
    onContextChange(value === "" ? null : value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search Filter */}
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-stone-400 dark:text-stone-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by product name..."
          className="block w-full pl-10 pr-4 py-2.5 h-11 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-stone-400 dark:placeholder-stone-500 shadow-sm transition-all duration-150"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Context Filter */}
      <div className="relative sm:w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Filter className="h-5 w-5 text-stone-400 dark:text-stone-500" />
        </div>
        <select
          value={selectedContextId || ""}
          onChange={(e) => handleContextSelect(e.target.value)}
          className="block w-full pl-10 pr-4 py-2.5 h-11 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all duration-150 appearance-none cursor-pointer"
        >
          <option value="">All Contexts</option>
          {contexts.map((ctx) => (
            <option key={ctx._id} value={ctx._id}>
              {ctx.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-stone-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
