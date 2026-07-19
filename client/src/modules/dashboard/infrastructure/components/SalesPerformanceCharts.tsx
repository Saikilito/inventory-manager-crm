import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CalendarDays } from 'lucide-react';
import { CustomTooltip } from './CustomTooltip';

export interface SalesPerformanceChartsProps {
  metrics: { periods: { daily: { period: string; revenue: number; profit: number; cogs: number }[]; monthly: { period: string; revenue: number; profit: number; expenses: number }[] } };
  isDark: boolean;
}

export const SalesPerformanceCharts: React.FC<SalesPerformanceChartsProps> = ({ metrics, isDark }) => {
  const [chartType, setChartType] = useState<'weekday' | 'monthly'>('weekday');

  const weekdayData = useMemo(() => {
    if (!metrics?.periods?.daily) return [];

    // Initialize weekday buckets
    const weekdays = [
      { name: 'Dom', revenue: 0, order: 6 },
      { name: 'Lun', revenue: 0, order: 0 },
      { name: 'Mar', revenue: 0, order: 1 },
      { name: 'Mié', revenue: 0, order: 2 },
      { name: 'Jue', revenue: 0, order: 3 },
      { name: 'Vie', revenue: 0, order: 4 },
      { name: 'Sáb', revenue: 0, order: 5 },
    ];

    metrics.periods.daily.forEach((day: { period: string; revenue: number; profit: number; cogs: number }) => {
      // Append midday time to enforce safe local parsing
      const date = new Date(day.period + 'T12:00:00');
      const dayIndex = date.getDay();
      weekdays[dayIndex].revenue += day.revenue;
    });

    // Sort Monday-to-Sunday for standard Rioplatense business calendar representation
    return weekdays.sort((a, b) => a.order - b.order);
  }, [metrics]);

  const monthlyData = useMemo(() => {
    if (!metrics?.periods?.monthly) return [];

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return metrics.periods.monthly.map((m: { period: string; revenue: number; profit: number; expenses: number }) => {
      const parts = m.period.split('-');
      const monthIndex = parseInt(parts[1], 10) - 1;
      const label = `${monthNames[monthIndex]} ${parts[0].substring(2)}`;
      return {
        monthLabel: label,
        revenue: m.revenue,
      };
    });
  }, [metrics]);



  return (
    <div className="col-span-12 lg:col-span-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-50 flex items-center gap-1.5">
              Sales Trends & Analysis
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              Analyze seasonal performance by weekday or monthly trends.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex bg-stone-100 dark:bg-stone-800/60 p-1 rounded-lg border border-stone-200/40 dark:border-stone-700/30 self-start sm:self-center">
            <button
              onClick={() => setChartType('weekday')}
              className={`px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition-all inline-flex items-center gap-1 ${
                chartType === 'weekday'
                  ? 'bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              By Weekday
            </button>
            <button
              onClick={() => setChartType('monthly')}
              className={`px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition-all inline-flex items-center gap-1 ${
                chartType === 'monthly'
                  ? 'bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Monthly Trend
            </button>
          </div>
        </div>

        <div className="w-full h-[230px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'weekday' ? (
              <BarChart
                data={weekdayData}
                margin={{ top: 10, right: 10, left: 15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.05 : 0.1} stroke={isDark ? '#e7e5e4' : '#292524'} />
                <XAxis 
                  dataKey="name" 
                  stroke={isDark ? '#a8a29e' : '#78716c'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis 
                  stroke={isDark ? '#a8a29e' : '#78716c'}
                  fontSize={11}
                  width={55}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) => `$${val}`}
                  dx={-8}
                />
                <Tooltip content={<CustomTooltip isCurrency={true} valueLabel="Sales" />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.05 : 0.1} stroke={isDark ? '#e7e5e4' : '#292524'} />
                <XAxis 
                  dataKey="monthLabel" 
                  stroke={isDark ? '#a8a29e' : '#78716c'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis 
                  stroke={isDark ? '#a8a29e' : '#78716c'}
                  fontSize={11}
                  width={55}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) => `$${val}`}
                  dx={-8}
                />
                <Tooltip content={<CustomTooltip isCurrency={true} valueLabel="Sales" />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};