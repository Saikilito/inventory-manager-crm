import React from "react";
import { useQuery, useSubscription, gql } from "@apollo/client";
import { Sparkles, X, Search, MessageSquare, Plus } from "lucide-react";
import { CLIENTS_QUERY } from "../../../modules/client/infrastructure/graphql/queries";
import { CreateChatSessionModal } from "./CreateChatSessionModal";

export const ChatTag = {
  ACTIVE_ORDER: "ACTIVE ORDER",
  PENDING_PAYMENT: "PENDING PAYMENT",
  PAID: "PAID",
  DELIVERED: "DELIVERED",
  ORDER_COMPLETED: "ORDER COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type ChatTag = (typeof ChatTag)[keyof typeof ChatTag];

const TAG_STYLES = {
  [ChatTag.ACTIVE_ORDER]:
    "bg-emerald-50/70 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40",
  [ChatTag.PENDING_PAYMENT]:
    "bg-amber-50/70 text-amber-800 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40",
  [ChatTag.PAID]:
    "bg-blue-50/70 text-blue-800 border border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/40",
  [ChatTag.DELIVERED]:
    "bg-purple-50/70 text-purple-800 border border-purple-200/60 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/40",
  [ChatTag.ORDER_COMPLETED]:
    "bg-emerald-700 text-white border border-emerald-700 dark:bg-emerald-800 dark:text-stone-50 dark:border-emerald-800",
  [ChatTag.CANCELLED]:
    "bg-red-50/70 text-red-800 border border-red-200/60 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/40",
  DEFAULT:
    "bg-stone-50 text-stone-700 border border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-800",
} as const;

const getTagStyles = (tag: string): string =>
  (TAG_STYLES as Record<string, string>)[tag] ?? TAG_STYLES.DEFAULT;

export const GET_CHAT_SESSIONS = gql`
  query GetChatSessions {
    getChatSessions {
      id
      whatsappId
      status
      driftCount
      assignedUserId
      assignedAgentId
      contactName
      assignedAgent {
        id
        name
      }
      extractedData {
        client {
          firstName
          lastName
          nationalId
          address
        }
        cart {
          productId
          productName
          quantity
          price
        }
      }
      tags
      createdAt
      updatedAt
    }
  }
`;

export const CHAT_SESSION_UPDATED_SUB = gql`
  subscription OnChatSessionUpdated {
    chatSessionUpdated {
      id
      whatsappId
      status
      driftCount
      assignedUserId
      assignedAgentId
      contactName
      assignedAgent {
        id
        name
      }
      extractedData {
        client {
          firstName
          lastName
          nationalId
          address
        }
        cart {
          productId
          productName
          quantity
          price
        }
      }
      tags
      createdAt
      updatedAt
    }
  }
`;

export interface ContactSidebarProps {
  activeContactId: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  onSelectContact: (id: string, isWhatsApp?: boolean) => void;
}

export const ContactSidebar: React.FC<ContactSidebarProps> = ({
  activeContactId,
  searchQuery,
  setSearchQuery,
  isSidebarOpen,
  setIsSidebarOpen,
  onSelectContact,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  // Query CRM Clients
  const { data: clientsData } = useQuery(CLIENTS_QUERY);

  // Query and subscribe to live chat sessions
  const { data: sessionsData, refetch: refetchSessions } = useQuery(GET_CHAT_SESSIONS);

  const { data: subData } = useSubscription(CHAT_SESSION_UPDATED_SUB);

  // Auto-refetch when session update subscription triggers
  React.useEffect(() => {
    if (subData?.chatSessionUpdated) {
      refetchSessions();
    }
  }, [subData, refetchSessions]);

  // Helper to map session/whatsappId to Display Name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Session GraphQL payload is untyped at this presentation boundary; the alternative (typing every list operation against the GraphQL schema) couples this view to the entire domain.
  const getSessionDisplayName = (session: any) => {
    if (clientsData?.getAllClients) {
      const client = clientsData.getAllClients.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Same justification as above; client list comes from untyped GraphQL response.
        (c: any) => c.whatsapp === session.whatsappId
      );
      if (client) {
        return `${client.firstName || ""} ${client.lastName || ""}`.trim();
      }
    }
    if (session.contactName) {
      return session.contactName;
    }
    return session.whatsappId;
  };

  const liveSessions = sessionsData?.getChatSessions || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Live sessions are untyped GraphQL results consumed only for filtering; see getSessionDisplayName.
  const filteredLiveSessions = liveSessions.filter((session: any) =>
    session.whatsappId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getSessionDisplayName(session).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`
        absolute lg:static inset-y-0 left-0 w-80 lg:w-auto lg:col-span-3 bg-white dark:bg-stone-900 z-40
        transition-transform duration-300 ease-out border-r border-stone-200 dark:border-stone-800 flex flex-col h-full min-h-0 max-h-full
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      {/* Header of contacts list */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          WhatsApp Chats
        </h2>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-md transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-stone-200 dark:border-stone-800">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search phone or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs placeholder:text-stone-400 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/40 p-2 space-y-4">
        {/* SECTION 1: WHATSAPP LIVE CHATS */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              WhatsApp Live Chats
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-emerald-500 rounded transition-colors"
              title="Start New Chat"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {filteredLiveSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-400 italic">
              No active customer chats.
            </div>
          ) : (
            filteredLiveSessions.map((session: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any -- Same untyped GraphQL payload as the surrounding filter; see getSessionDisplayName.
              const isActive = session.whatsappId === activeContactId;
              const clientName = getSessionDisplayName(session);
              const isBot = session.status === "BOT";
              const isPending = session.status === "PENDING_HUMAN";

              return (
                <button
                  key={session.id}
                  onClick={() => onSelectContact(session.whatsappId, true)}
                  className={`
                    w-full text-left p-3 flex items-start gap-3 transition-all duration-200 outline-none rounded-xl border
                    ${
                      isActive
                        ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/30 dark:border-emerald-500/20 shadow-xs"
                        : "bg-transparent hover:bg-stone-50/75 dark:hover:bg-stone-800/40 border-transparent"
                    }
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200
                        ${
                          isActive
                            ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400"
                            : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                        }
                      `}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-stone-900 ${isBot ? "bg-emerald-500" : isPending ? "bg-amber-500" : "bg-blue-500"}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold truncate ${isActive ? "text-emerald-800 dark:text-emerald-400" : "text-stone-900 dark:text-stone-100"}`}>
                        {clientName}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase
                        ${
                          isBot
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : isPending
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400"
                        }
                      `}>
                        {session.status}
                      </span>
                      {session.tags && session.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${getTagStyles(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      {isCreateModalOpen && (
        <CreateChatSessionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSelectContact={onSelectContact}
          refetchSessions={refetchSessions}
        />
      )}
    </aside>
  );
};

export default ContactSidebar;
