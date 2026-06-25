import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Inbox } from 'lucide-react';
import { ITopClient } from '@modules/dashboard/domain/dashboard.repository';
import { CustomTooltip } from './CustomTooltip';

export interface TopClientsChartProps {
  data: ITopClient[];
  isDark: boolean;
}

export const TopClientsChart: React.FC<TopClientsChartProps> = ({ data, isDark }) => {
  return (
    <div className="col-span-12 lg:col-span-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-6 shadow-sm flex flex-col">
      <div className="mb-6">
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
          Top purchasing clients
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
          Leading clients by cumulative total of completed purchases.
        </p>
      </div>
      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] p-6 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
          <Inbox className="w-8 h-8 text-stone-400 dark:text-stone-600 mb-2" />
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No sales registered</p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Statistics will be updated once orders are completed.</p>
        </div>
      ) : (
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" aspect={16 / 9}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.05 : 0.1} stroke={isDark ? '#e7e5e4' : '#292524'} />
              <XAxis 
                dataKey="clientName" 
                stroke={isDark ? '#a8a29e' : '#78716c'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
                tickFormatter={(val: string) => val.length > 12 ? `${val.substring(0, 10)}...` : val}
              />
              <YAxis 
                stroke={isDark ? '#a8a29e' : '#78716c'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                dx={-8}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
