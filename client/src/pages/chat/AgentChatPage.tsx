import React from "react";
import { Cpu, RefreshCw, LayoutGrid, MessageSquare } from "lucide-react";
import { ContactSidebar } from "./components/ContactSidebar";
import { ChatHeader } from "./components/ChatHeader";
import { MessageFeed } from "./components/MessageFeed";
import { ChatInput } from "./components/ChatInput";
import { QrPortal } from "./components/QrPortal";
import { ActionPanelDrawer } from "./components/ActionPanelDrawer";
import { AgentsConfigWorkspace } from "./components/AgentsConfigWorkspace";
import { useChatSession } from "./use-chat-session";

export {
  GET_CHAT_MESSAGES,
  CHAT_MESSAGE_RECEIVED_SUB,
  SEND_MESSAGE_TO_CHAT,
  SEND_WHISPER_MESSAGE,
} from "./use-chat-session";

export const AgentChatPage: React.FC = () => {
  const session = useChatSession();

  if (session.connectionStatus === "QR" || session.connectionStatus === "DISCONNECTED") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-stone-900 dark:text-stone-50 tracking-tight flex items-center gap-3">
            <Cpu className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            AI Copilot
          </h1>
          <button
            onClick={() => session.refetchConnection()}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-50 rounded-xl"
            title="Refresh Connection"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <QrPortal onConnected={() => session.refetchConnection()} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col animate-[fadeIn_0.4s_ease-out] min-h-0 bg-stone-50 dark:bg-stone-950">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 p-4 lg:p-6 pb-0 lg:pb-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-stone-900 dark:text-stone-50 tracking-tight flex items-center gap-3">
            <Cpu className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            WhatsApp Realtime CRM
          </h1>
          <p className="text-xs lg:text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium">
            Advanced real-time sales dashboard integrating chat streams, customer creation, and automatic delivery calculations.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-xl text-xs font-bold border border-stone-200/50 dark:border-stone-850 shadow-inner">
            <button
              onClick={() => session.setActiveTab("conversations")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                session.activeTab === "conversations"
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Conversations
            </button>
            <button
              onClick={() => session.setActiveTab("agents")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                session.activeTab === "agents"
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              AI Agents Workspace
            </button>
          </div>

          {session.activeTab === "conversations" && (
            <button
              onClick={() => session.setIsActionPanelOpen(!session.isActionPanelOpen)}
              className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold border transition-colors shadow-xs
                ${
                  session.isActionPanelOpen
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
                    : "bg-white text-stone-700 border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-800 hover:bg-stone-50"
                }
              `}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Action Panel
            </button>
          )}
        </div>
      </div>

      {session.activeTab === "conversations" ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-white dark:bg-stone-900 border-t lg:border border-stone-200 dark:border-stone-800 lg:rounded-2xl lg:mx-6 lg:mb-6 shadow-sm relative animate-[fadeIn_0.2s_ease-out] mt-4">
          {session.isSidebarOpen && (
            <div
              className="lg:hidden absolute inset-0 bg-stone-900/40 backdrop-blur-xs z-30 transition-opacity duration-300"
              onClick={() => session.setIsSidebarOpen(false)}
            />
          )}

          <ContactSidebar
            activeContactId={session.activeContactId}
            searchQuery={session.searchQuery}
            setSearchQuery={session.setSearchQuery}
            isSidebarOpen={session.isSidebarOpen}
            setIsSidebarOpen={session.setIsSidebarOpen}
            onSelectContact={session.handleSelectContact}
          />

          <section className={`flex flex-col h-full min-h-0 max-h-full bg-stone-50/50 dark:bg-stone-950/20 overflow-hidden relative transition-all duration-300
            ${session.isActionPanelOpen && session.activeContact ? "lg:col-span-6 xl:col-span-6" : "lg:col-span-9"}
          `}>
            {session.activeContact ? (
              <>
                <ChatHeader
                  activeContact={session.activeContact}
                  onOpenSidebar={() => session.setIsSidebarOpen(true)}
                  isWhatsAppChat={session.isWhatsAppMode}
                  whatsappId={session.isWhatsAppMode ? session.activeContactId : undefined}
                  status={
                    session.currentSessionStatus as "BOT" | "HUMAN" | "PENDING_HUMAN" | undefined
                  }
                  onStatusUpdated={() => session.refetchSessions()}
                  extractedData={undefined}
                />

                {session.isWhatsAppMode && (
                  <div className="flex border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-[11px] font-black uppercase tracking-wider select-none shrink-0">
                    <button
                      onClick={() => session.setChatChannel("whatsapp")}
                      className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                        session.chatChannel === "whatsapp"
                          ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 bg-emerald-500/5"
                          : "border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                      }`}
                    >
                      <span>💬 WhatsApp Chat</span>
                    </button>
                    <button
                      onClick={() => session.setChatChannel("whisper")}
                      className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                        session.chatChannel === "whisper"
                          ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-500/5"
                          : "border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                      }`}
                    >
                      <span>🤫 AI Whisper (Private)</span>
                    </button>
                  </div>
                )}

                <MessageFeed activeMessages={session.activeMessages} />

                <ChatInput
                  activeContact={session.activeContact}
                  onSendMessage={session.handleSendMessage}
                  onSendSticker={session.handleSendSticker}
                  isBotActive={session.currentSessionStatus === "BOT" && session.chatChannel === "whatsapp"}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-stone-50 dark:bg-stone-950/20">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-900 flex items-center justify-center mb-4 text-stone-400 dark:text-stone-600 border border-stone-200/50 dark:border-stone-800/50 shadow-xs">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">No Chat Selected</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mt-1 font-medium">
                  Select an active customer conversation from the sidebar or click the "+" button to start a new live WhatsApp chat session.
                </p>
              </div>
            )}
          </section>

          {session.isActionPanelOpen && session.activeContact && (
            <div className="lg:col-span-3 xl:col-span-3 h-full border-l border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
              <ActionPanelDrawer
                isOpen={session.isActionPanelOpen}
                onClose={() => session.setIsActionPanelOpen(false)}
                whatsappId={session.isWhatsAppMode ? session.activeContactId : ""}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-lg overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          <AgentsConfigWorkspace />
        </div>
      )}
    </div>
  );
};

export default AgentChatPage;
