import React, { useEffect, useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { TRANSITION_DURATION_MS } from "../../../utils/constants";

interface OrderDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderShortId: string;
}

export const OrderDeleteModal: React.FC<OrderDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  orderShortId,
}) => {
  const [mounted, setMounted] = useState(false);
  const [animateShow, setAnimateShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const timer = setTimeout(() => setAnimateShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateShow(false);
      const timer = setTimeout(() => setMounted(false), TRANSITION_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity duration-300 ease-out cursor-pointer ${
          animateShow ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 ease-out ${
          animateShow ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Top Header & Alert Banner */}
        <div className="px-6 py-5 flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 bg-red-500/5 dark:bg-red-500/5">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">
              Delete Order
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Irreversible database operation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-medium text-stone-600 dark:text-stone-300 leading-relaxed">
            Are you sure you want to permanently delete order <span className="font-mono font-extrabold text-stone-950 dark:text-stone-50">#{orderShortId}</span>? 
            This operation cannot be undone and will restore any deducted stock back to the inventory.
          </p>

          <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-normal">
              Warning: If this order was linked to a client that has been deleted, deleting this order is safe and will keep your sales logs clean.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950/40 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-xs font-bold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-950 border border-stone-200 dark:border-stone-800 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="h-10 px-4 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 hover:shadow-red-500/10 active:bg-red-800 transition-all cursor-pointer"
          >
            Permanently Delete
          </button>
        </div>
      </div>
    </div>
  );
};
