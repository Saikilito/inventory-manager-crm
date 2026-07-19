import React from "react";
import { Cpu, Trash2 } from "lucide-react";
import { AgentRole } from "@shared-domain/chat/agent.entity";

export interface AgentWorkspaceHeaderProps {
  isChatView: boolean;
  isCreatingNew: boolean;
  name: string;
  role: AgentRole;
  showDelete: boolean;
  onDeleteClick?: (e: React.MouseEvent) => void;
}

export const AgentWorkspaceHeader: React.FC<AgentWorkspaceHeaderProps> = ({
  isChatView,
  isCreatingNew,
  name,
  role,
  showDelete,
  onDeleteClick
}) => {
  return (
    <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0 bg-stone-50/30 dark:bg-stone-950/10">
      <div>
        <h3 className="text-lg font-black text-stone-900 dark:text-stone-50 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          {isChatView ? `Sandbox Chat: ${name}` : isCreatingNew ? "Create New AI Assistant" : `Configure Agent: ${name}`}
          {!isCreatingNew && !isChatView && role !== AgentRole.SALES && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-250/60 dark:bg-amber-950/25 dark:text-amber-400 dark:border-amber-900/50">
              Sandbox Only
            </span>
          )}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
          {isChatView 
            ? "Test your agent's responses in real-time. This playtest sandbox is stateless and won't save any messages to the database."
            : isCreatingNew
              ? "Set prompt parameters and capabilities to bootstrap a brand new agent."
              : "Edit properties, prompts, and transactional parameters for this profile."
          }
        </p>
      </div>

      {showDelete && onDeleteClick && (
        <button
          type="button"
          onClick={onDeleteClick}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-red-200 dark:border-red-950/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 text-xs font-bold"
        >
          <Trash2 className="w-4 h-4" />
          Delete Agent
        </button>
      )}
    </div>
  );
};
