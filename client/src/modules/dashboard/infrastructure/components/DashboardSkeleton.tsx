import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title area skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded-lg w-48" />
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-96" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex items-center justify-between">
            <div className="space-y-3 w-1/2">
              <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-16" />
              <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded w-24" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-stone-200 dark:bg-stone-800" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4">
          <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded w-48" />
          <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-32" />
          <div className="h-[250px] bg-stone-200 dark:bg-stone-800 rounded-lg" />
        </div>
        <div className="lg:col-span-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4">
          <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded w-48" />
          <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-32" />
          <div className="h-[250px] bg-stone-200 dark:bg-stone-800 rounded-lg" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4">
        <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded w-36" />
        <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-64" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between border-b border-stone-100 dark:border-stone-800/50 pb-2">
              <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/4" />
              <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
