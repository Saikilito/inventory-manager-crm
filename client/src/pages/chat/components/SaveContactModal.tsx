import React, { useState, useEffect } from "react";
import { useMutation, gql } from "@apollo/client";
import { X, Loader2, Lock, User } from "lucide-react";

export const SAVE_CONTACT_NAME = gql`
  mutation SaveContactName($whatsappId: String!, $name: String!) {
    saveContactName(whatsappId: $whatsappId, name: $name) {
      id
      whatsappId
      contactName
    }
  }
`;

interface SaveContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappId: string;
  extractedData?: {
    client?: {
      firstName?: string;
      lastName?: string;
    };
  } | null;
  onSuccess?: () => void;
}

export const SaveContactModal: React.FC<SaveContactModalProps> = ({
  isOpen,
  onClose,
  whatsappId,
  extractedData,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [saveContactName, { loading }] = useMutation(SAVE_CONTACT_NAME);

  // Autocomplete: Prefill fields from extractedData when modal opens
  useEffect(() => {
    if (isOpen) {
      const firstName = extractedData?.client?.firstName || "";
      const lastName = extractedData?.client?.lastName || "";
      const combined = `${firstName} ${lastName}`.trim();
      setName(combined);
      setErrorMessage("");
    }
  }, [isOpen, extractedData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Contact Name is required.");
      return;
    }

    try {
      await saveContactName({
        variables: {
          whatsappId,
          name: name.trim(),
        },
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to save contact name.");
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Save Contact Name
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Assign a name to this WhatsApp session for easier identification.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ReadOnly WhatsApp Field with Lock icon */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              WhatsApp / Phone (Locked)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={whatsappId}
                disabled
                className="w-full pl-9 pr-4 py-2.5 bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-sm font-semibold text-stone-500 dark:text-stone-400 cursor-not-allowed select-none animate-pulse-none"
              />
            </div>
          </div>

          {/* Contact Name Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Contact Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="e.g. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-sm placeholder:text-stone-400 text-stone-950 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                required
                autoFocus
              />
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 font-medium leading-relaxed">
              This name will be saved locally on the chat session. It will NOT register a full client in the CRM.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Save Contact
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveContactModal;