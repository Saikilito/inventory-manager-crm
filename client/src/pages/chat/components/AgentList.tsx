import React from "react";
import { Agent } from "../types";
import { AgentRole, AgentStatus } from "@shared-domain/chat/agent.entity";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  UserMinus,
  UserCheck,
} from "lucide-react";

export interface AgentListProps {
  agents: Agent[];
  loading: boolean;
  assignedAgentId?: string | null;
  whatsappId: string;
  assigning: boolean;
  setShowForm: (show: boolean) => void;
  handleEditClick: (agent: Agent) => void;
  handleDeleteClick: (id: string) => void;
  handleAssignClick: (id: string | null) => void;
}

export const AgentList: React.FC<AgentListProps> = ({
  agents,
  loading,
  assignedAgentId,
  whatsappId,
  assigning,
  setShowForm,
  handleEditClick,
  handleDeleteClick,
  handleAssignClick,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Configured AI Assistants ({agents.length})
        </span>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Custom Agent
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <p className="text-xs text-stone-400 mt-2">Loading directory...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
          <p className="text-sm text-stone-400 font-semibold italic">
            No custom AI Agents defined yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => {
            const isAssigned = assignedAgentId === agent.id;
            return (
              <div
                key={agent.id}
                className={`p-4 border rounded-xl flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md
                  ${
                    isAssigned
                      ? "bg-emerald-500/5 border-emerald-500/40 dark:border-emerald-500/30 ring-1 ring-emerald-500/20"
                      : "bg-white dark:bg-stone-900 border-stone-250 dark:border-stone-800/80"
                  }
                `}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-black text-stone-900 dark:text-stone-50 flex items-center gap-1.5">
                        {agent.name}
                        {isAssigned && (
                          <span
                            className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                            title="Active on current WhatsApp chat"
                          />
                        )}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-bold uppercase mt-1">
                        {agent.role} •{" "}
                        <span
                          className={
                            agent.status === AgentStatus.ACTIVE
                              ? "text-emerald-500"
                              : "text-stone-500"
                          }
                        >
                          {agent.status}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEditClick(agent)}
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600"
                        title="Edit Agent"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(agent.id)}
                        className="p-1.5 rounded-lg border border-red-200 dark:border-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/10 text-red-400 hover:text-red-500"
                        title="Delete Agent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2.5 line-clamp-2 leading-relaxed">
                    {agent.systemPrompt}
                  </p>

                  {agent.enabledTools && agent.enabledTools.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {agent.enabledTools.map((t: string) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 border border-stone-200/50 dark:border-stone-750"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400 font-medium">
                    {isAssigned
                      ? "Assigned to Chat"
                      : "Inactive for this chat"}
                  </span>
                  {agent.role !== AgentRole.SALES ? (
                    <span className="inline-flex items-center h-8 px-3 rounded-lg border border-amber-200/50 bg-amber-50/70 text-amber-850 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40 text-[10px] font-black uppercase tracking-wide">
                      Sales Only
                    </span>
                  ) : isAssigned ? (
                    <button
                      onClick={() => handleAssignClick(null)}
                      disabled={assigning}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 text-[10px] font-black uppercase tracking-wide"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      Unassign
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAssignClick(agent.id)}
                      disabled={assigning || !whatsappId}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-stone-250 bg-white hover:bg-stone-50 dark:bg-stone-900 dark:border-stone-800 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-black uppercase tracking-wide disabled:opacity-40"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Assign to chat
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
