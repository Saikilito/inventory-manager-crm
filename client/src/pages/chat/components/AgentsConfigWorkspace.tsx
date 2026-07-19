import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_AGENTS, GET_CHAT_SETTINGS } from "@modules/chat/infrastructure/graphql/queries";
import { CREATE_AGENT, UPDATE_AGENT, DELETE_AGENT, UPDATE_CHAT_SETTINGS } from "@modules/chat/infrastructure/graphql/mutations";
import {
  Save,
  Cpu,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { AgentRole, AgentStatus } from "@shared-domain/chat/agent.entity";
import { Agent } from "@pages/chat/types";

import { SandboxChatUI } from "./AgentsConfigWorkspace/SandboxChatUI";
import { AgentDirectorySidebar } from "./AgentsConfigWorkspace/AgentDirectorySidebar";
import { AgentWorkspaceHeader } from "./AgentsConfigWorkspace/AgentWorkspaceHeader";
import { AgentWorkspaceTabs, SubTabType } from "./AgentsConfigWorkspace/AgentWorkspaceTabs";
import { 
  PromptAndToolsFields, 
  PaymentDetailsFields, 
  LogisticsSettingsFields 
} from "./AgentsConfigWorkspace/AgentFormSections";
import { SettingsFormData } from "./AgentsConfigWorkspace/constants";

export const AgentsConfigWorkspace: React.FC = () => {
  // Queries
  const { data: agentsData, loading: loadingAgents, refetch: refetchAgents } = useQuery(GET_AGENTS);
  const { data: settingsData, loading: loadingSettings } = useQuery(GET_CHAT_SETTINGS);

  // Mutations
  const [createAgent, { loading: creating }] = useMutation(CREATE_AGENT);
  const [updateAgent, { loading: updating }] = useMutation(UPDATE_AGENT);
  const [deleteAgent] = useMutation(DELETE_AGENT);
  const [updateSettings, { loading: savingSettings }] = useMutation(UPDATE_CHAT_SETTINGS);

  // Selected agent state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form Fields for Agent Prompt & Tools
  const [name, setName] = useState("");
  const [role, setRole] = useState<AgentRole>(AgentRole.SALES);
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.ACTIVE);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [enabledTools, setEnabledTools] = useState<string[]>([]);

  // Form Fields for Sales Settings (Pago Móvil / Binance / Logistics)
  const [settings, setSettings] = useState<SettingsFormData>({
    pagoMovilBank: "",
    pagoMovilPhone: "",
    pagoMovilId: "",
    binancePayUser: "",
    whatsappOriginLatitude: 10.5051512,
    whatsappOriginLongitude: -66.9392015,
    whatsappAlertGroupJid: "",
  });

  const updateSetting = <K extends keyof SettingsFormData>(key: K, value: SettingsFormData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Sub-tabs for SALES Agent edits
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("prompt");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMessage] = useState<string | null>(null);

  const agents: Agent[] = agentsData?.getAgents || [];

  const resetForm = () => {
    if (isCreatingNew) {
      if (agents.length > 0) {
        handleSelectAgent(agents[0]);
      } else {
        setIsCreatingNew(false);
        setSelectedAgent(null);
      }
    } else if (selectedAgent) {
      handleSelectAgent(selectedAgent);
    }
  };

  // Load chat settings once fetched
  useEffect(() => {
    if (settingsData?.getChatSettings) {
      const s = settingsData.getChatSettings;
      setSettings({
        pagoMovilBank: s.pagoMovilBank || "",
        pagoMovilPhone: s.pagoMovilPhone || "",
        pagoMovilId: s.pagoMovilId || "",
        binancePayUser: s.binancePayUser || "",
        whatsappOriginLatitude: s.whatsappOriginLatitude || 10.5051512,
        whatsappOriginLongitude: s.whatsappOriginLongitude || -66.9392015,
        whatsappAlertGroupJid: s.whatsappAlertGroupJid || "",
      });
    }
  }, [settingsData]);

  // Autoselect first agent or fallback
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent && !isCreatingNew) {
      handleSelectAgent(agents[0]);
    }
  }, [agents, selectedAgent, isCreatingNew]);

  // Safeguard subtabs selection based on active agent role
  useEffect(() => {
    if (role !== AgentRole.SALES && (activeSubTab === "payment" || activeSubTab === "logistics")) {
      setActiveSubTab("prompt");
    }
  }, [role, activeSubTab]);

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsCreatingNew(false);
    setName(agent.name);
    setRole(agent.role);
    setStatus(agent.status as AgentStatus);
    setSystemPrompt(agent.systemPrompt);
    setEnabledTools(agent.enabledTools);
    setActiveSubTab("prompt");
    setErrorMessage(null);
  };

  const handleCreateNewClick = () => {
    setIsCreatingNew(true);
    setSelectedAgent(null);
    setName("");
    setRole(AgentRole.SALES);
    setStatus(AgentStatus.ACTIVE);
    setSystemPrompt("");
    setEnabledTools([]);
    setErrorMessage(null);
  };

  const handleToggleTool = (toolKey: string) => {
    setEnabledTools((prev) =>
      prev.includes(toolKey)
        ? prev.filter((t) => t !== toolKey)
        : [...prev, toolKey]
    );
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setToastMsg(null);

    const agentInput = {
      name,
      role,
      status,
      systemPrompt,
      enabledTools,
    };

    try {
      if (isCreatingNew) {
        const res = await createAgent({
          variables: { input: agentInput },
        });
        setToastMsg("Agent created successfully!");
        refetchAgents();
        if (res.data?.createAgent) {
          handleSelectAgent(res.data.createAgent);
        }
      } else if (selectedAgent) {
        // Save Agent Core Prompt & Tools
        await updateAgent({
          variables: {
            input: {
              id: selectedAgent.id,
              ...agentInput,
            },
          },
        });

        // If it's a SALES agent, also save payment and coordinate settings dynamically
        if (role === AgentRole.SALES) {
          await updateSettings({
            variables: {
              input: {
                ...settings,
                whatsappOriginLatitude: parseFloat(settings.whatsappOriginLatitude as unknown as string),
                whatsappOriginLongitude: parseFloat(settings.whatsappOriginLongitude as unknown as string),
                systemPrompt, // Keep prompts in sync as fallback
              },
            },
          });
        }

        setToastMsg("Configuration updated successfully!");
        refetchAgents();
      }
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to save configuration.");
    }
  };

  const handleDeleteClick = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this AI Agent?")) return;
    try {
      await deleteAgent({ variables: { id } });
      setToastMsg("Agent deleted successfully.");
      refetchAgents();
      setSelectedAgent(null);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to delete Agent.");
    }
  };

  if (loadingAgents || loadingSettings) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-stone-50 dark:bg-stone-950/20">
        <Loader2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
        <p className="text-sm font-semibold text-stone-500 dark:text-stone-400 mt-4 animate-pulse">
          Loading Agents Workspace...
        </p>
      </div>
    );
  }

  const isChatView = activeSubTab === "chat" && selectedAgent !== null && !isCreatingNew;

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden bg-stone-50/50 dark:bg-stone-950/10">
      {/* LEFT COLUMN: AGENTS DIRECTORY */}
      <AgentDirectorySidebar 
        agents={agents} 
        selectedAgentId={selectedAgent?.id} 
        onSelectAgent={handleSelectAgent} 
        onCreateNewClick={handleCreateNewClick} 
      />

      {/* RIGHT COLUMN: ACTIVE CONFIGURATION WORKSPACE */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-stone-900 flex flex-col">
        {(selectedAgent || isCreatingNew) ? (
          isChatView && selectedAgent ? (
            /* SANDBOX CHAT VIEW: Pure independent div */
            <div className="flex-1 flex flex-col h-full min-h-0">
              <AgentWorkspaceHeader 
                isChatView={true} 
                isCreatingNew={false} 
                name={name} 
                role={role} 
                showDelete={true} 
                onDeleteClick={(e) => handleDeleteClick(selectedAgent.id, e)} 
              />
              
              <AgentWorkspaceTabs 
                activeSubTab={activeSubTab} 
                setActiveSubTab={setActiveSubTab} 
                role={role} 
              />

              <SandboxChatUI agentId={selectedAgent.id} />
            </div>
          ) : (
            /* CONFIG/FORM VIEW: Standard form layout */
            <form onSubmit={handleSaveSubmit} className="flex-1 flex flex-col h-full">
              <AgentWorkspaceHeader 
                isChatView={false} 
                isCreatingNew={isCreatingNew} 
                name={name} 
                role={role} 
                showDelete={!isCreatingNew && selectedAgent !== null} 
                onDeleteClick={(e) => selectedAgent && handleDeleteClick(selectedAgent.id, e)} 
              />

              {/* Notifications Bar */}
              {toastMsg && (
                <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-850 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>{toastMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-850 rounded-xl text-xs font-semibold text-red-800 dark:text-red-400 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {!isCreatingNew && (
                <AgentWorkspaceTabs 
                  activeSubTab={activeSubTab} 
                  setActiveSubTab={setActiveSubTab} 
                  role={role} 
                />
              )}

              {/* Scrollable Form Fields Content */}
              <div className="flex-1 p-6 space-y-6">
                {(isCreatingNew || role !== AgentRole.SALES || activeSubTab === "prompt") && (
                  <PromptAndToolsFields 
                    name={name} setName={setName}
                    role={role} setRole={setRole}
                    status={status} setStatus={setStatus}
                    systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt}
                    enabledTools={enabledTools} handleToggleTool={handleToggleTool}
                  />
                )}

                {!isCreatingNew && role === AgentRole.SALES && activeSubTab === "payment" && (
                  <PaymentDetailsFields settings={settings} updateSetting={updateSetting} />
                )}

                {!isCreatingNew && role === AgentRole.SALES && activeSubTab === "logistics" && (
                  <LogisticsSettingsFields settings={settings} updateSetting={updateSetting} />
                )}
              </div>

              {/* Form Footer Buttons */}
              <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950/40 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3 shrink-0">
                {(isCreatingNew || selectedAgent) && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-10 px-4 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={creating || updating || savingSettings}
                  className="h-10 px-5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {creating || updating || savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isCreatingNew ? "Create Agent" : "Save Workspace Changes"}
                    </>
                  )}
                </button>
              </div>
            </form>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-stone-50/50 dark:bg-stone-950/5">
            <Cpu className="w-12 h-12 text-stone-300 dark:text-stone-700 animate-pulse" />
            <p className="text-sm font-black text-stone-400 uppercase mt-4">
              Select or create an AI Agent to edit
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentsConfigWorkspace;
