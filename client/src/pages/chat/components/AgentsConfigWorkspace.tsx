import React from "react";
import { Loader2, Cpu } from "lucide-react";
import { AgentDirectorySidebar } from "./AgentsConfigWorkspace/AgentDirectorySidebar";
import { AgentWorkspaceHeader } from "./AgentsConfigWorkspace/AgentWorkspaceHeader";
import { AgentWorkspaceTabs } from "./AgentsConfigWorkspace/AgentWorkspaceTabs";
import { SandboxChatUI } from "./AgentsConfigWorkspace/SandboxChatUI";
import {
  PromptAndToolsFields,
} from "./AgentsConfigWorkspace/AgentFormSections";
import {
  EmptyState,
  FormFooter,
  NotificationBar,
} from "./AgentsConfigWorkspace/WorkspaceNotifications";
import { useAgentsConfigLogic } from "./AgentsConfigWorkspace/useAgentsConfigLogic";

export const AgentsConfigWorkspace: React.FC = () => {
  const {
    agents,
    loadingAgents,
    selectedAgent,
    isCreatingNew,
    name, setName,
    role, setRole,
    status, setStatus,
    systemPrompt, setSystemPrompt,
    enabledTools,
    activeSubTab,
    setActiveSubTab,
    toastMsg,
    errorMsg,
    handleSelectAgent,
    handleCreateNewClick,
    handleToggleTool,
    handleDeleteClick,
    handleSaveSubmit,
    resetForm,
    isSubmitting,
  } = useAgentsConfigLogic();

  if (loadingAgents) {
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
  const showPromptFields = isCreatingNew || activeSubTab === "prompt";

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden bg-stone-50/50 dark:bg-stone-950/10">
      <AgentDirectorySidebar
        agents={agents}
        selectedAgentId={selectedAgent?.id}
        onSelectAgent={handleSelectAgent}
        onCreateNewClick={handleCreateNewClick}
      />

      <div className="flex-1 overflow-y-auto bg-white dark:bg-stone-900 flex flex-col">
        {selectedAgent || isCreatingNew ? (
          isChatView && selectedAgent ? (
            <div className="flex-1 flex flex-col h-full min-h-0">
              <AgentWorkspaceHeader
                isChatView
                isCreatingNew={false}
                name={name}
                role={role}
                showDelete
                onDeleteClick={(e) => handleDeleteClick(selectedAgent.id, e)}
              />
              <AgentWorkspaceTabs activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
              <SandboxChatUI key={selectedAgent.id} agentId={selectedAgent.id} />
            </div>
          ) : (
            <form onSubmit={handleSaveSubmit} className="flex-1 flex flex-col h-full">
              <AgentWorkspaceHeader
                isChatView={false}
                isCreatingNew={isCreatingNew}
                name={name}
                role={role}
                showDelete={!isCreatingNew && selectedAgent !== null}
                onDeleteClick={(e) => selectedAgent && handleDeleteClick(selectedAgent.id, e)}
              />

              {toastMsg && <NotificationBar variant="success" message={toastMsg} />}
              {errorMsg && <NotificationBar variant="error" message={errorMsg} />}

              {!isCreatingNew && (
                <AgentWorkspaceTabs activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
              )}

              <div className="flex-1 p-6 space-y-6">
                {showPromptFields && (
                  <PromptAndToolsFields
                    name={name} setName={setName}
                    role={role} setRole={setRole}
                    status={status} setStatus={setStatus}
                    systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt}
                    enabledTools={enabledTools} handleToggleTool={handleToggleTool}
                  />
                )}
              </div>

              <FormFooter
                isCreatingNew={isCreatingNew}
                isSubmitting={isSubmitting}
                onCancel={resetForm}
              />
            </form>
          )
        ) : (
          <EmptyState
            icon={<Cpu className="w-12 h-12 text-stone-300 dark:text-stone-700 animate-pulse" />}
            title="Select or create an AI Agent to edit"
          />
        )}
      </div>
    </div>
  );
};

export default AgentsConfigWorkspace;
