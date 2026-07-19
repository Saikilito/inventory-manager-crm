import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { X, Phone, Loader2 } from "lucide-react";

export const CREATE_CHAT_SESSION = gql`
  mutation CreateChatSession($whatsappId: String!) {
    createChatSession(whatsappId: $whatsappId) {
      id
      whatsappId
      status
    }
  }
`;

interface CreateChatSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (id: string, isWhatsApp?: boolean) => void;
  refetchSessions: () => Promise<unknown>;
}

export const CreateChatSessionModal: React.FC<CreateChatSessionModalProps> = ({
  isOpen,
  onClose,
  onSelectContact,
  refetchSessions,
}) => {
  const [whatsappId, setWhatsappId] = useState("");
  const [validationError, setValidationError] = useState("");
  const [createChatSession, { loading }] = useMutation(CREATE_CHAT_SESSION);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Basic Validation
    const cleanNum = whatsappId.replace(/[\s\-+]/g, "");
    if (!cleanNum) {
      setValidationError("Phone number cannot be empty.");
      return;
    }

    if (!/^\d+$/.test(cleanNum)) {
      setValidationError("Phone number must contain only digits, spaces, hyphens, or a leading '+'.");
      return;
    }

    if (cleanNum.length < 8) {
      setValidationError("Phone number must have at least 8 digits.");
      return;
    }

    try {
      const { data } = await createChatSession({
        variables: {
          whatsappId: cleanNum,
        },
      });

      if (data?.createChatSession) {
        await refetchSessions();
        onSelectContact(data.createChatSession.whatsappId, true);
        onClose();
      }
    } catch (err: unknown) {
      setValidationError((err as Error).message || "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-50">
              Start WhatsApp Chat
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Initiate an outbound WhatsApp live chat session.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              WhatsApp / Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="e.g. +584121234567"
                value={whatsappId}
                onChange={(e) => {
                  setWhatsappId(e.target.value);
                  setValidationError("");
                }}
                disabled={loading}
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-sm placeholder:text-stone-400 text-stone-950 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-2 leading-normal">
              Enter the customer's phone number with area/country code. Suffix <span className="font-mono text-emerald-600 dark:text-emerald-400">@s.whatsapp.net</span> will be auto-appended.
            </p>
          </div>

          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold leading-relaxed">
              {validationError}
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
                  Initiating...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Start Chat
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChatSessionModal;