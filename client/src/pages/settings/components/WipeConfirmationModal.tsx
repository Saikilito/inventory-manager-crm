import React, { useState } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

interface WipeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
}

export const WipeConfirmationModal: React.FC<WipeConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  error,
  setError,
}) => {
  const [wipeInput, setWipeInput] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wipeInput !== "WIPE") {
      setError("Please type 'WIPE' to confirm.");
      return;
    }
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">
              Critical Confirmation Required
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
              You are about to permanently delete all isolated sandbox testing records (clients, products,
              orders, users). This action is irreversible.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/20 text-red-700 dark:text-red-400 rounded-xl p-3 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Type <span className="text-rose-500">"WIPE"</span> to verify authority:
            </label>
            <input
              type="text"
              required
              value={wipeInput}
              onChange={(e) => setWipeInput(e.target.value)}
              placeholder="Type WIPE"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-950 dark:text-stone-50 font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-stone-200 dark:border-stone-800 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer flex items-center justify-center"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Confirm Purge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
