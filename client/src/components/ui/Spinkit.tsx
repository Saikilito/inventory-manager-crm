import React from 'react';

export const Spinkit: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-6" role="status" aria-label="Loading">
      <div className="relative w-12 h-12">
        {/* Outer ring */}
        <div className="w-12 h-12 rounded-full border-4 border-stone-200 dark:border-stone-800"></div>
        {/* Spinning indicator */}
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin motion-reduce:animate-none"></div>
      </div>
    </div>
  );
};

export default Spinkit;
