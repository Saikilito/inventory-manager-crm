import React from 'react';

interface ErrorAlertProps {
  error: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => {
  return (
    <div
      className="flex items-start gap-2.5 p-3.5 mb-5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-400 text-sm border border-red-200/60 dark:border-red-900/30 transition-colors duration-300"
      role="alert"
    >
      <svg
        className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
        />
      </svg>
      <div className="font-medium leading-relaxed">{error}</div>
    </div>
  );
};

export default ErrorAlert;
