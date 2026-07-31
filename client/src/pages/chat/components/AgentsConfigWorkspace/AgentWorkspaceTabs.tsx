import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquareCode, Brain } from "lucide-react";

export type SubTabType = "prompt" | "chat";

const KNOWLEDGE_BRAIN_ROUTE = "/chat/knowledge-brain";

export interface AgentWorkspaceTabsProps {
  activeSubTab: SubTabType;
  setActiveSubTab: (tab: SubTabType) => void;
  showChatTab?: boolean;
}

export const AgentWorkspaceTabs: React.FC<AgentWorkspaceTabsProps> = ({
  activeSubTab,
  setActiveSubTab,
  showChatTab = true
}) => {
  const navigate = useNavigate();

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
        1. Persona & Tools
      </button>

      <button
        type="button"
        onClick={() => navigate(KNOWLEDGE_BRAIN_ROUTE)}
        className="py-3.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 border-transparent text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center gap-2"
      >
        <Brain className="w-4 h-4" />
        2. Knowledge Brain
      </button>

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
