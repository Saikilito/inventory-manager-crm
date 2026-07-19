import React from "react";
import { AgentRole, AgentStatus } from "@shared-domain/chat/agent.entity";
import { AVAILABLE_TOOLS, SettingsFormData } from "./constants";

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
          System Instructions & Prompt Context
        </label>
        <textarea
          required
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
          placeholder="You are an expert sales assistant..."
        />
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

export interface PaymentDetailsFieldsProps {
  settings: SettingsFormData;
  updateSetting: <K extends keyof SettingsFormData>(key: K, value: SettingsFormData[K]) => void;
}

export const PaymentDetailsFields: React.FC<PaymentDetailsFieldsProps> = ({ settings, updateSetting }) => {
  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="space-y-4 border-b border-stone-100 dark:border-stone-800 pb-5">
        <h4 className="text-sm font-bold text-stone-950 dark:text-stone-50 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Pago Móvil (Venezuela Interbank)
        </h4>
        <p className="text-xs text-stone-500 leading-relaxed">
          These parameters are injected dynamically into Gemini's tool outcomes whenever a client requests purchase validation details over WhatsApp.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5">
              Banco / Bank
            </label>
            <input
              type="text"
              value={settings.pagoMovilBank}
              onChange={(e) => updateSetting("pagoMovilBank", e.target.value)}
              className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Banesco"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5">
              Teléfono / Phone
            </label>
            <input
              type="text"
              value={settings.pagoMovilPhone}
              onChange={(e) => updateSetting("pagoMovilPhone", e.target.value)}
              className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 04121234567"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5">
              Cédula / ID
            </label>
            <input
              type="text"
              value={settings.pagoMovilId}
              onChange={(e) => updateSetting("pagoMovilId", e.target.value)}
              className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. V-12345678"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-stone-950 dark:text-stone-50 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Binance Pay
        </h4>
        <div>
          <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5">
            Binance Pay Email/User
          </label>
          <input
            type="text"
            value={settings.binancePayUser}
            onChange={(e) => updateSetting("binancePayUser", e.target.value)}
            className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. caracasrepuestos@gmail.com"
          />
        </div>
      </div>
    </div>
  );
};

export interface LogisticsSettingsFieldsProps {
  settings: SettingsFormData;
  updateSetting: <K extends keyof SettingsFormData>(key: K, value: SettingsFormData[K]) => void;
}

export const LogisticsSettingsFields: React.FC<LogisticsSettingsFieldsProps> = ({ settings, updateSetting }) => {
  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="space-y-4 border-b border-stone-100 dark:border-stone-800 pb-5">
        <h4 className="text-sm font-bold text-stone-950 dark:text-stone-50 uppercase tracking-wider">
          Store Origin Coordinates (GPS)
        </h4>
        <p className="text-xs text-stone-500 leading-relaxed">
          Coordinates used as the starting route to automatically calculate shipping prices on motorizado deliveries inside Caracas.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={settings.whatsappOriginLatitude}
              onChange={(e) => updateSetting("whatsappOriginLatitude", parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={settings.whatsappOriginLongitude}
              onChange={(e) => updateSetting("whatsappOriginLongitude", parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-stone-950 dark:text-stone-50 uppercase tracking-wider">
          Logistics Alert Group
        </h4>
        <div>
          <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5">
            WhatsApp Group JID
          </label>
          <input
            type="text"
            value={settings.whatsappAlertGroupJid}
            onChange={(e) => updateSetting("whatsappAlertGroupJid", e.target.value)}
            className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. 120363123456789012@g.us"
          />
        </div>
      </div>
    </div>
  );
};
