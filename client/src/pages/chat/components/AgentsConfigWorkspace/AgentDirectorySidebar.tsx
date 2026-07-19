import React from "react";
import { Plus } from "lucide-react";
import { AgentRole, AgentStatus } from "@shared-domain/chat/agent.entity";
import { Agent } from "@pages/chat/types";

export interface AgentDirectorySidebarProps {
  agents: Agent[];
  selectedAgentId?: string;
  onSelectAgent: (agent: Agent) => void;
  onCreateNewClick: () => void;
}

export const AgentDirectorySidebar: React.FC<AgentDirectorySidebarProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onCreateNewClick,
}) => {
  return (
    <div className="w-80 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col shrink-0">
      <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <span className="text-xs font-black text-stone-400 uppercase tracking-wider">
          Directory ({agents.length})
        </span>
        <button
          onClick={onCreateNewClick}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Agent
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {agents.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent)}
              className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-all duration-200 outline-none
                ${
                  isSelected
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/30 dark:border-emerald-500/20 shadow-xs"
                    : "bg-transparent hover:bg-stone-50/75 dark:hover:bg-stone-800/40 border-transparent"
                }
              `}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-colors
                  ${
                    isSelected
                      ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                  }
                `}
              >
                {agent.role === AgentRole.SALES ? "SL" : agent.role === AgentRole.SUPPORT ? "SP" : "OP"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold truncate ${isSelected ? "text-emerald-800 dark:text-emerald-400" : "text-stone-900 dark:text-stone-100"}`}>
                    {agent.name}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 font-bold uppercase mt-0.5 truncate">
                  {agent.role} • <span className={agent.status === AgentStatus.ACTIVE ? "text-emerald-500" : "text-stone-500"}>{agent.status}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
