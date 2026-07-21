import React from "react";
import { AgentRole, AgentStatus } from "@shared-domain/chat/agent.entity";
import { AVAILABLE_TOOLS } from "./constants";

export interface PromptAndToolsFieldsProps {
  name: string;
  setName: (v: string) => void;
  role: AgentRole;
  setRole: (v: AgentRole) => void;
  status: AgentStatus;
  setStatus: (v: AgentStatus) => void;
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  enabledTools: string[];
  handleToggleTool: (toolKey: string) => void;
}

export const PromptAndToolsFields: React.FC<PromptAndToolsFieldsProps> = ({
  name, setName,
  role, setRole,
  status, setStatus,
  systemPrompt, setSystemPrompt,
  enabledTools, handleToggleTool
}) => {
  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1.5">
            Agent Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Sales Specialist"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1.5">
            Role / Personality
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AgentRole)}
            className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 dark:text-stone-200"
          >
            <option value={AgentRole.SALES}>Sales Agent (SALES)</option>
            <option value={AgentRole.SUPPORT}>Customer Support (SUPPORT)</option>
            <option value="CRM_OPERATOR">CRM Operator (COACH)</option>
            <option value="LIBRARIAN">Librarian (RESEARCH/KNOWLEDGE)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1.5">
            Agent Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AgentStatus)}
            className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 dark:text-stone-200"
          >
            <option value={AgentStatus.ACTIVE}>ACTIVE</option>
            <option value={AgentStatus.INACTIVE}>INACTIVE</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1.5">
          Persona Prompt (Agent Character Only)
        </label>
        <textarea
          required
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
          placeholder="You are a friendly, expert sales assistant specialized in motorcycle spare parts..."
        />
        <p className="text-[10px] text-stone-500 mt-1.5 leading-relaxed">
          Business rules, payment methods, store location, and processes live in the Knowledge Brain tab. Keep this field for persona only.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase">
          Enabled Tools (Granular Capabilities)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-stone-50 dark:bg-stone-950/45 border border-stone-200 dark:border-stone-800 rounded-xl">
          {AVAILABLE_TOOLS.map((tool) => {
            const isChecked = enabledTools.includes(tool.key);
            return (
              <label
                key={tool.key}
                className="flex items-center gap-3 cursor-pointer select-none text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-emerald-500 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleTool(tool.key)}
                  className="h-4 w-4 rounded border-stone-300 dark:border-stone-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span>{tool.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
