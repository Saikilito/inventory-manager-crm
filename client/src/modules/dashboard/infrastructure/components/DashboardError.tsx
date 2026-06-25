import React from 'react';
import { TrendingUp } from 'lucide-react';

export interface DashboardErrorProps {
  errorMessage: string;
  onRetry: () => void;
}

export const DashboardError: React.FC<DashboardErrorProps> = ({ errorMessage, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-2xl">
        <TrendingUp className="w-8 h-8 rotate-180" />
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Error loading data</h3>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {errorMessage || "The dashboard statistics could not be loaded. Please try again."}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 font-semibold rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors text-xs"
      >
        Retry
      </button>
    </div>
  );
};
