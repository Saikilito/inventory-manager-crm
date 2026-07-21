import React from "react";
import { useMutation, gql } from "@apollo/client";
import { Menu, MoreVertical, Cpu, User, Loader2, Trash2 } from "lucide-react";
import { Contact } from "../types";
import { SaveContactModal } from "./SaveContactModal";

export const UPDATE_CHAT_SESSION_STATUS = gql`
  mutation UpdateChatSessionStatus($whatsappId: String!, $status: String!) {
    updateChatSessionStatus(whatsappId: $whatsappId, status: $status) {
      id
      whatsappId
      status
    }
  }
`;

export const DELETE_CHAT_SESSION = gql`
  mutation DeleteChatSession($whatsappId: String!) {
    deleteChatSession(whatsappId: $whatsappId)
  }
`;

export interface ChatHeaderProps {
  activeContact: Contact;
  onOpenSidebar: () => void;
  isWhatsAppChat?: boolean;
  whatsappId?: string;
  status?: "BOT" | "HUMAN" | "PENDING_HUMAN";
  onStatusUpdated?: () => void;
  extractedData?: {
    client?: {
      firstName?: string;
      lastName?: string;
    };
  } | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeContact,
  onOpenSidebar,
  isWhatsAppChat = false,
  whatsappId,
  status = "BOT",
  onStatusUpdated,
  extractedData,
}) => {
  const [isSaveContactModalOpen, setIsSaveContactModalOpen] = React.useState(false);
  const [updateStatus, { loading }] = useMutation(UPDATE_CHAT_SESSION_STATUS);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [deleteChat, { loading: deleting }] = useMutation(DELETE_CHAT_SESSION);

  const handleDeleteChat = async () => {
    if (!whatsappId) return;
    if (confirm("¿Estás seguro de que deseas eliminar este chat y todo su historial?")) {
      try {
        await deleteChat({
          variables: { whatsappId },
        });
        setIsMenuOpen(false);
        if (onStatusUpdated) {
          onStatusUpdated();
        }
      } catch (err) {
        console.error("Failed to delete chat:", err);
      }
    }
  };

  const handleToggleStatus = async (newStatus: "BOT" | "HUMAN") => {
    if (!whatsappId) return;
    try {
      await updateStatus({
        variables: {
          whatsappId,
          status: newStatus,
        },
      });
      if (onStatusUpdated) {
        onStatusUpdated();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        {/* Toggle mobile sidebar */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-1.5 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Open conversations"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Header Active Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center font-bold text-xs text-stone-700 dark:text-stone-300">
            {activeContact.avatar}
          </div>
          {activeContact.online && (
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-stone-900 bg-emerald-500" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-stone-900 dark:text-stone-50">
              {activeContact.name}
            </span>
            {activeContact.online ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700" />
            )}
          </div>
          <div className="text-[10px] text-stone-500 dark:text-stone-400 font-semibold">
            {activeContact.company}
          </div>
        </div>
      </div>

      {/* Header Controls: Sliding HITL Toggle Button */}
      <div className="flex items-center gap-3">
        {isWhatsAppChat && whatsappId && (
          <div className="flex items-center bg-stone-100 dark:bg-stone-950 p-1 rounded-xl shadow-inner border border-stone-200/10 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-stone-900/50 rounded-xl flex items-center justify-center z-10">
                <Loader2 className="w-4 h-4 text-stone-600 animate-spin" />
              </div>
            )}
            <button
              type="button"
              onClick={() => handleToggleStatus("BOT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider
                ${
                  status === "BOT"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                }
              `}
            >
              <Cpu className="w-3.5 h-3.5" />
              AI Bot
            </button>
            <button
              type="button"
              onClick={() => handleToggleStatus("HUMAN")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider
                ${
                  status !== "BOT"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                }
              `}
            >
              <User className="w-3.5 h-3.5" />
              Operator
            </button>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition-colors cursor-pointer"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl shadow-lg py-1.5 z-50 animate-fadeIn">
              {isWhatsAppChat && whatsappId ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSaveContactModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900/60 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    Save Contact Name
                  </button>
                  <div className="border-t border-stone-100 dark:border-stone-800 my-1" />
                  <button
                    type="button"
                    onClick={handleDeleteChat}
                    disabled={deleting}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-stone-50 dark:hover:bg-stone-900/60 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? "Eliminando..." : "Eliminar Chat"}
                  </button>
                </>
              ) : (
                <div className="px-4 py-2 text-xs text-stone-400 dark:text-stone-500 italic">
                  No options available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {isSaveContactModalOpen && (
        <SaveContactModal
          isOpen={isSaveContactModalOpen}
          onClose={() => setIsSaveContactModalOpen(false)}
          whatsappId={whatsappId!}
          extractedData={extractedData}
          onSuccess={() => {
            if (onStatusUpdated) {
              onStatusUpdated();
            }
          }}
        />
      )}
    </div>
  );
};
