import React from 'react';
import { formatCurrency } from '../utils/format-currency';

export interface TooltipPayloadItem {
  value: number;
  fill?: string;
  color?: string;
  name?: string;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  isCurrency?: boolean;
  valueLabel?: string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const color = payload[0].fill || payload[0].color;
    return (
      <div className="bg-white/80 dark:bg-stone-950/85 backdrop-blur-md border border-stone-200 dark:border-stone-800 p-3 rounded-lg shadow-xl text-xs font-medium text-stone-800 dark:text-stone-200">
        <p className="font-semibold text-stone-900 dark:text-stone-50 mb-1">{label}</p>
        <p className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
          <span>Total:</span>
          <span className="font-bold text-stone-900 dark:text-stone-50 tabular-nums">
            {formatCurrency(value)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};
