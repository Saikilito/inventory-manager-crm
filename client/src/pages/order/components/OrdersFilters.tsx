import React from 'react';
import { Search, Plus, Filter, Store } from 'lucide-react';
import type { GQLContext } from '@modules/context/infrastructure/graphql/types';

interface OrdersFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedContextId: string;
  setSelectedContextId: (id: string) => void;
  contexts: GQLContext[];
  onNewOrder: () => void;
}

export const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedContextId,
  setSelectedContextId,
  contexts,
  onNewOrder,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-stone-400 dark:text-stone-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client name or order ID..."
          className="block w-full pl-10 pr-4 py-2 h-10 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-stone-400 dark:placeholder-stone-500 shadow-sm transition-all duration-150"
        />
      </div>

      {/* Context Filter */}
      <div className="relative min-w-[200px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Store className="h-4 w-4 text-stone-400 dark:text-stone-500" />
        </div>
        <select
          value={selectedContextId}
          onChange={(e) => setSelectedContextId(e.target.value)}
          className="block w-full pl-10 pr-8 py-2 h-10 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all duration-150 appearance-none cursor-pointer"
        >
          <option value="">All Contexts</option>
          {contexts.map((ctx) => (
            <option key={ctx._id} value={ctx._id}>
              {ctx.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Filter className="h-4 w-4 text-stone-400 dark:text-stone-500" />
        </div>
      </div>

      {/* New Order Button */}
      <button
        onClick={onNewOrder}
        className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm gap-1.5 cursor-pointer"
      >
        <Plus className="w-4 h-4 shrink-0" />
        New Order
      </button>
    </div>
  );
};
