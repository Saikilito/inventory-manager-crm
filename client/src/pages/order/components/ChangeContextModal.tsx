import React from "react";
import { X, Store, AlertTriangle } from "lucide-react";
import type { GQLContext } from "@modules/context/infrastructure/graphql/types";

interface ChangeContextModalProps {
  order: {
    _id: string;
    contextId?: string;
  };
  contexts: GQLContext[];
  isOpen: boolean;
  isUpdating: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (newContextId: string | null) => Promise<void>;
}

export const ChangeContextModal: React.FC<ChangeContextModalProps> = ({
  order,
  contexts,
  isOpen,
  isUpdating,
  error,
  onClose,
  onConfirm,
}) => {
  const [selectedContextId, setSelectedContextId] = React.useState<string>(order.contextId || "");
  const [showConfirm, setShowConfirm] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedContextId(order.contextId || "");
      setShowConfirm(false);
    }
  }, [isOpen, order.contextId]);

  if (!isOpen) return null;

  const currentContextName = contexts.find((c) => c._id === order.contextId)?.name || "General (No Context)";
  const newContextName = contexts.find((c) => c._id === selectedContextId)?.name || "General (No Context)";
  const hasChange = selectedContextId !== (order.contextId || "");

  const handleProceed = () => {
    if (hasChange) {
      setShowConfirm(true);
    }
  };

  const handleConfirm = async () => {
    await onConfirm(selectedContextId || null);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/60 dark:bg-stone-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
              <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Change Business Context
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Order #{order._id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="px-6 pt-4 pb-0">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          </div>
        )}

        {!showConfirm ? (
          <div className="px-6 py-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Current Context
              </label>
              <div className="text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700">
                {currentContextName}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                New Context
              </label>
              <select
                value={selectedContextId}
                onChange={(e) => setSelectedContextId(e.target.value)}
                disabled={isUpdating}
                className="w-full h-11 px-3 py-2 rounded-xl text-sm font-medium border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              >
                <option value="">General (No Context)</option>
                {contexts.map((ctx) => (
                  <option key={ctx._id} value={ctx._id}>
                    {ctx.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isUpdating}
                className="flex-1 h-10 px-4 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                disabled={isUpdating || !hasChange}
                className="flex-1 h-10 px-4 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isUpdating ? "Updating..." : "Change Context"}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Confirm Context Change
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  This will move the order from <strong>{currentContextName}</strong> to <strong>{newContextName}</strong>.
                  This action will affect how the order is grouped and reported.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isUpdating}
                className="flex-1 h-10 px-4 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isUpdating}
                className="flex-1 h-10 px-4 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? "Updating..." : "Confirm Change"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
