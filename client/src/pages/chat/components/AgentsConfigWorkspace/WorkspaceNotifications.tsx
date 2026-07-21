import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

interface NotificationBarProps {
  variant: "success" | "error";
  message: string;
}

const NOTIFICATION_STYLES: Record<NotificationBarProps["variant"], string> = {
  success:
    "mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-850 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]",
  error:
    "mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-850 rounded-xl text-xs font-semibold text-red-800 dark:text-red-400 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]",
};

const ICON_STYLES: Record<NotificationBarProps["variant"], string> = {
  success: "text-emerald-500",
  error: "text-red-500",
};

export const NotificationBar: React.FC<NotificationBarProps> = ({ variant, message }) => (
  <div className={NOTIFICATION_STYLES[variant]}>
    {variant === "success" ? (
      <CheckCircle className={`w-4 h-4 ${ICON_STYLES.success}`} />
    ) : (
      <AlertCircle className={`w-4 h-4 ${ICON_STYLES.error}`} />
    )}
    <span>{message}</span>
  </div>
);

interface FormFooterProps {
  isCreatingNew: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
}

export const FormFooter: React.FC<FormFooterProps> = ({ isCreatingNew, isSubmitting, onCancel }) => (
  <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950/40 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3 shrink-0">
    {(isCreatingNew || true) && (
      <button
        type="button"
        onClick={onCancel}
        className="h-10 px-4 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        Cancel
      </button>
    )}
    <button
      type="submit"
      disabled={isSubmitting}
      className="h-10 px-5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center gap-2 disabled:opacity-50"
    >
      {isSubmitting ? "Saving..." : isCreatingNew ? "Create Agent" : "Save Workspace Changes"}
    </button>
  </div>
);

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-12 bg-stone-50/50 dark:bg-stone-950/5">
    {icon}
    <p className="text-sm font-black text-stone-400 uppercase mt-4">{title}</p>
    {subtitle && <p className="text-xs text-stone-400 mt-2">{subtitle}</p>}
  </div>
);
