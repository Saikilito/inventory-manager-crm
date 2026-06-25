import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginatorProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export const Paginator: React.FC<PaginatorProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPrevPage,
  onNextPage,
}) => {
  const pages = Math.ceil(totalItems / pageSize);

  return (
    <div className="flex items-center justify-center gap-4 mt-8 mb-8" aria-label="Pagination">
      <button
        onClick={onPrevPage}
        disabled={currentPage <= 1}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:pointer-events-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </button>

      <span className="text-sm font-medium text-stone-500 dark:text-stone-400 tabular-nums">
        Page {currentPage} of {pages || 1}
      </span>

      <button
        onClick={onNextPage}
        disabled={currentPage >= pages}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:pointer-events-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        aria-label="Next page"
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Paginator;
