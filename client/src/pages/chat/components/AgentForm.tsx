import React from "react";
import { Save, Loader2 } from "lucide-react";
import { AgentRole, AgentStatus } from "@shared-domain/chat/agent.entity";

export const AVAILABLE_TOOLS = [
  { key: "searchStock", label: "Search Stock (Catalog)" },
  { key: "calculateDeliveryFee", label: "Calculate Delivery Fee" },
  { key: "createClient", label: "Create Client in CRM" },
  { key: "createOrder", label: "Create Draft CRM Order" },
  { key: "queryMongoDB", label: "Query Database (Direct)" },
];

export interface AgentFormProps {
  name: string;
  setName: (v: string) => void;
  role: AgentRole;
  setRole: (v: AgentRole) => void;
  status: AgentStatus;
  setStatus: (v: AgentStatus) => void;
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  enabledTools: string[];
  handleToggleTool: (k: string) => void;
  creating: boolean;
  updating: boolean;
  handleSaveSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
}

export const AgentForm: React.FC<AgentFormProps> = ({
  name,
  setName,
  role,
  setRole,
  status,
  setStatus,
  systemPrompt,
  setSystemPrompt,
  enabledTools,
  handleToggleTool,
  creating,
  updating,
  handleSaveSubmit,
  resetForm,
}) => {
  return (
    <form
      onSubmit={handleSaveSubmit}
      className="space-y-5 animate-[fadeIn_0.2s_ease-out]"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
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
          <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
            Role / Personality
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AgentRole)}
            className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 dark:text-stone-200"
          >
            <option value={AgentRole.SALES}>Sales Agent (SALES)</option>
            <option value={AgentRole.SUPPORT}>
              Customer Support (SUPPORT)
            </option>
            <option value="CRM_OPERATOR">CRM Operator (COACH)</option>
            <option value="LIBRARIAN">Librarian (RESEARCH/KNOWLEDGE)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
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
          System Prompt (Knowledge & Instructions)
        </label>
        <textarea
          required
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="You are a warm salesman representing Caracas Repuestos. Describe prices, tone, return policies..."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase">
          Enabled Tools (Capabilities)
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

      <div className="flex justify-end gap-3 pt-4 border-t border-stone-150 dark:border-stone-800">
        <button
          type="button"
          onClick={resetForm}
          className="h-10 px-4 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-700 hover:bg-stone-150 transition-colors"
        >
          Back to List
        </button>
        <button
          type="submit"
          disabled={creating || updating}
          className="h-10 px-5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center gap-2"
        >
          {creating || updating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Agent Config
            </>
          )}
        </button>
      </div>
    </form>
  );
};
