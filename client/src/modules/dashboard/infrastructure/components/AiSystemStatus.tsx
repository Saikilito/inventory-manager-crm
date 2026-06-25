import React from 'react';
import { Cpu } from 'lucide-react';

export const AiSystemStatus: React.FC = () => {
  return (
    <div className="col-span-12 lg:col-span-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-200">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
            AI System Status
          </h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 font-medium">
          Integration of the Gemini cognitive engine with the local database and Engram memory.
        </p>

        <div className="divide-y divide-stone-100 dark:divide-stone-800/60 space-y-3.5">
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Active Model</span>
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200">Gemini 2.0 Flash</span>
          </div>

          <div className="flex items-center justify-between pt-3.5">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Connection Status</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Online
            </span>
          </div>

          <div className="flex items-center justify-between pt-3.5">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Average Latency</span>
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200">120ms</span>
          </div>

          <div className="flex flex-col gap-1.5 pt-3.5">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Context Memory</span>
            <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-400 italic">
              Active (FTS5 + Engram)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
