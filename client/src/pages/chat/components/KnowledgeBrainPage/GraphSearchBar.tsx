import React from "react";
import { Search, X } from "lucide-react";
import { KNOWN_HIERARCHY_LEVELS } from "@shared-domain/knowledge";
import CategoryFilter from "@modules/knowledge/infrastructure/components/CategoryFilter";
import { HIERARCHY_LEVEL_META, type GraphFilters } from "@modules/knowledge/infrastructure/components/KnowledgeGraph/graph-helpers";

interface GraphSearchBarProps {
  filters: GraphFilters;
  onChange: (filters: GraphFilters) => void;
  matchCount: number | null;
}

const selectClassName =
  "block w-full sm:w-56 h-11 px-3 pr-8 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all duration-150 cursor-pointer";

export const GraphSearchBar: React.FC<GraphSearchBarProps> = ({ filters, onChange, matchCount }) => {
  const hasFilters = Boolean(filters.searchText || filters.category || filters.hierarchyLevel);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[220px]">
        <label htmlFor="knowledge-graph-search" className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
          Search entries
        </label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true" />
          <input
            id="knowledge-graph-search"
            type="text"
            value={filters.searchText ?? ""}
            onChange={(event) => onChange({ ...filters, searchText: event.target.value })}
            placeholder="Find an index or document by title…"
            className="w-full h-11 pl-9 pr-3 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      <CategoryFilter value={filters.category ?? ""} onChange={(value) => onChange({ ...filters, category: value })} />

      <div>
        <label htmlFor="knowledge-graph-hierarchy-filter" className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
          Node type
        </label>
        <select
          id="knowledge-graph-hierarchy-filter"
          value={filters.hierarchyLevel ?? ""}
          onChange={(event) => onChange({ ...filters, hierarchyLevel: event.target.value })}
          className={selectClassName}
        >
          <option value="">All node types</option>
          {KNOWN_HIERARCHY_LEVELS.map((level: string) => (
            <option key={level} value={level}>
              {HIERARCHY_LEVEL_META[level]?.label ?? level}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="inline-flex items-center gap-1.5 h-11 px-3 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}

      {hasFilters && matchCount !== null && (
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 pb-3">
          {matchCount} match{matchCount === 1 ? "" : "es"}
        </span>
      )}
    </div>
  );
};

export default GraphSearchBar;
