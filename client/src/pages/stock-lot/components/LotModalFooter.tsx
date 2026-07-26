import React from "react";

interface LotModalFooterProps {
  error: string | null;
  loading: boolean;
  purchaseDate: string;
  handleClose: () => void;
  handleDraftSubmit: (e: React.FormEvent) => void;
}

export const LotModalFooter: React.FC<LotModalFooterProps> = ({
  error,
  loading,
  purchaseDate,
  handleClose,
  handleDraftSubmit,
}) => {
  const pd = new Date(purchaseDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isFutureDate = pd > today;

  return (
    <div className="bg-stone-50 dark:bg-stone-900/80 border-t border-stone-200 dark:border-stone-800 rounded-b-2xl flex flex-col">
      {error && (
        <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}
      <div className="px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleClose}
          className="px-5 py-2.5 text-sm font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDraftSubmit}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            form="stock-lot-form"
            disabled={loading || isFutureDate}
            title={isFutureDate ? "Future stock lots can only be saved as drafts" : ""}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2 ${
              isFutureDate
                ? "bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed"
                : "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white/90 disabled:opacity-50"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Saving...
              </span>
            ) : (
              "Save and Receive Stock"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
