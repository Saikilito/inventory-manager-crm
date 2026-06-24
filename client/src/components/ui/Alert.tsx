import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  message: string;
  type?: AlertType;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ message, type = 'success', className = '' }) => {
  const styles = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-800/40',
      text: 'text-emerald-800 dark:text-emerald-300',
      icon: CheckCircle2,
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800/40',
      text: 'text-red-800 dark:text-red-300',
      icon: XCircle,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800/40',
      text: 'text-amber-800 dark:text-amber-300',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800/40',
      text: 'text-blue-800 dark:text-blue-300',
      icon: Info,
    },
  };

  const currentStyle = styles[type];
  const Icon = currentStyle.icon;

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium transition-colors ${currentStyle.bg} ${currentStyle.border} ${currentStyle.text} ${className}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 leading-relaxed">{message}</span>
    </div>
  );
};

export default Alert;
