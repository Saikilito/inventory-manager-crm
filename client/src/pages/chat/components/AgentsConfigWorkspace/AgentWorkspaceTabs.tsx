import React from "react";
import { MessageSquareCode, DollarSign, MapPin } from "lucide-react";
import { AgentRole } from "@shared-domain/chat/agent.entity";

export type SubTabType = "prompt" | "payment" | "logistics" | "chat";

export interface AgentWorkspaceTabsProps {
  activeSubTab: SubTabType;
  setActiveSubTab: (tab: SubTabType) => void;
  role: AgentRole;
  showChatTab?: boolean;
}

export const AgentWorkspaceTabs: React.FC<AgentWorkspaceTabsProps> = ({
  activeSubTab,
  setActiveSubTab,
  role,
  showChatTab = true
}) => {
  return (
    <div className="flex border-b border-stone-100 dark:border-stone-800 px-6 bg-stone-50/50 dark:bg-stone-950/20 shrink-0">
      <button
        type="button"
        onClick={() => setActiveSubTab("prompt")}
        className={`py-3.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
          activeSubTab === "prompt"
            ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
            : "border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
        }`}
      >
        <MessageSquareCode className="w-4 h-4" />
        1. Prompt & Tools
      </button>

      {role === AgentRole.SALES && (
        <>
          <button
            type="button"
            onClick={() => setActiveSubTab("payment")}
            className={`py-3.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeSubTab === "payment"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            2. Payment Details
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("logistics")}
            className={`py-3.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeSubTab === "logistics"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            }`}
          >
            <MapPin className="w-4 h-4" />
            3. Store Location & Alerts
          </button>
        </>
      )}

      {showChatTab && (
        <button
          type="button"
          onClick={() => setActiveSubTab("chat")}
          className={`py-3.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "chat"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
              : "border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          }`}
        >
          💬 Live Playtest / Chat
        </button>
      )}
    </div>
  );
};
