import React from 'react';
import { useQuery } from '@apollo/client';
import { match } from 'ts-pattern';
import { Target, ShieldCheck, Activity, Loader2 } from 'lucide-react';
import { GET_FIXED_EXPENSE_TEMPLATES } from '../../../expense/infrastructure/graphql/fixed-expense';
import { formatCurrency } from '@utils/formatters';
import { getISOWeekKey } from '@shared-domain/shared/utils/date-utils';

export interface OperatingCostIndexWidgetProps {
  metrics: { periods?: { daily?: { period: string; profit: number }[]; weekly?: { period: string; profit: number }[]; monthly?: { period: string; profit: number }[] } };
  contextId?: string;
  isDark?: boolean;
}

export const OperatingCostIndexWidget: React.FC<OperatingCostIndexWidgetProps> = ({ metrics, contextId }) => {
  const { data: templatesData, loading: loadingTemplates } = useQuery(GET_FIXED_EXPENSE_TEMPLATES, {
    variables: { contextId: contextId || null },
    fetchPolicy: 'network-only',
  });

  if (loadingTemplates) {
    return (
      <div className="col-span-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-6 shadow-sm flex flex-col justify-center items-center min-h-[220px]">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
        <p className="text-xs text-stone-500 mt-2 font-semibold">Calculating profitability targets...</p>
      </div>
    );
  }

  const templates = templatesData?.getFixedExpenseTemplates || [];

  const activeTemplates = templates.filter((t: { isActive: boolean; amount: number }) => t.isActive);
  const moc = activeTemplates.reduce((sum: number, t: { isActive: boolean; amount: number }) => sum + t.amount, 0);
  const doc = Number((moc / 30).toFixed(2));
  const woc = Number((doc * 7).toFixed(2));

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dailyKey = `${year}-${month}-${day}`;

  const weeklyKey = getISOWeekKey(today);
  const monthlyKey = `${year}-${month}`;

  const todaySgp = metrics?.periods?.daily?.find((d: { period: string; profit: number }) => d.period === dailyKey)?.profit || 0;
  const weekSgp = metrics?.periods?.weekly?.find((w: { period: string; profit: number }) => w.period === weeklyKey)?.profit || 0;
  const monthSgp = metrics?.periods?.monthly?.find((m: { period: string; profit: number }) => m.period === monthlyKey)?.profit || 0;

  if (templates.length === 0) {
    return (
      <div className="col-span-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[250px]">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-50 flex items-center gap-1.5">
            Profitability & Breakeven Index
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
            Real-time operating cost coverage analysis based on active templates.
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-lg my-4">
          <Target className="w-8 h-8 text-stone-400 dark:text-stone-600 mb-2" />
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Fixed Cost Targets Inactive</p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-[280px]">
            Please add your recurring fixed expenses (wages, rent, software) under the <strong>Expenses (Fixed)</strong> tab to see your breakeven benchmarks!
          </p>
        </div>
      </div>
    );
  }

  const renders = [
    { label: 'Today', target: doc, achieved: todaySgp, tag: 'daily' },
    { label: 'This Week', target: woc, achieved: weekSgp, tag: 'weekly' },
    { label: 'This Month', target: moc, achieved: monthSgp, tag: 'monthly' },
  ];

  return (
    <div className="col-span-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[250px]">
      <div>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
              Profitability & Breakeven Index
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              Real-time fixed operating cost coverage vs sales gross profit.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-extrabold tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full border border-stone-200/50 dark:border-stone-700/50">
              {activeTemplates.length} Active Templates
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 my-5 border-y border-stone-100 dark:border-stone-800/60 py-4">
          <div className="text-center">
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">DOC (Daily)</p>
            <p className="text-lg font-black text-stone-800 dark:text-stone-200 mt-1 tabular-nums">{formatCurrency(doc)}</p>
          </div>
          <div className="text-center border-x border-stone-100 dark:border-stone-800/60">
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">WOC (Weekly)</p>
            <p className="text-lg font-black text-stone-800 dark:text-stone-200 mt-1 tabular-nums">{formatCurrency(woc)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">MOC (Monthly)</p>
            <p className="text-lg font-black text-stone-800 dark:text-stone-200 mt-1 tabular-nums">{formatCurrency(moc)}</p>
          </div>
        </div>

        <div className="space-y-4">
          {renders.map((item) => {
            const isBreakeven = item.achieved >= item.target;
            const percentage = Math.min(Math.round((item.achieved / item.target) * 100), 100);

            return (
              <div key={item.label} className="bg-stone-50 dark:bg-stone-950/20 rounded-xl p-3 border border-stone-100 dark:border-stone-800/30 flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">{item.label}</span>
                    <span className="text-[11px] font-extrabold text-stone-500 dark:text-stone-400 tabular-nums">
                      {formatCurrency(item.achieved)} <span className="text-stone-300 dark:text-stone-600">/</span> {formatCurrency(item.target)}
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isBreakeven ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end">
                  {match(isBreakeven)
                    .with(true, () => (
                      <span className="text-[10px] uppercase font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/10 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Real Profit
                      </span>
                    ))
                    .with(false, () => (
                      <span className="text-[10px] uppercase font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/10 inline-flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Under Target
                      </span>
                    ))
                    .exhaustive()}
                  <span className="text-[10px] text-stone-400 mt-1 tabular-nums">
                    {percentage}% covered
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
