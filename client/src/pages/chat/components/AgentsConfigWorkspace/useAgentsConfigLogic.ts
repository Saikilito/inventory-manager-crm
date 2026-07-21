import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_AGENTS } from "@modules/chat/infrastructure/graphql/queries";
import { CREATE_AGENT, UPDATE_AGENT, DELETE_AGENT } from "@modules/chat/infrastructure/graphql/mutations";
import { AgentRole, AgentStatus } from "@shared-domain/chat/agent.entity";
import { Agent } from "@pages/chat/types";
import type { SubTabType } from "./AgentWorkspaceTabs";

interface UseAgentsConfigLogicResult {
  agents: Agent[];
  loadingAgents: boolean;
  selectedAgent: Agent | null;
  isCreatingNew: boolean;
  name: string;
  setName: (v: string) => void;
  role: AgentRole;
  setRole: (v: AgentRole) => void;
  status: AgentStatus;
  setStatus: (v: AgentStatus) => void;
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  enabledTools: string[];
  activeSubTab: SubTabType;
  setActiveSubTab: (tab: SubTabType) => void;
  toastMsg: string | null;
  errorMsg: string | null;
  setErrorMessage: (msg: string | null) => void;
  setToastMsg: (msg: string | null) => void;
  handleSelectAgent: (agent: Agent) => void;
  handleCreateNewClick: () => void;
  handleToggleTool: (toolKey: string) => void;
  handleDeleteClick: (id: string, e?: React.MouseEvent) => Promise<void>;
  handleSaveSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  refetchAgents: () => unknown;
  isSubmitting: boolean;
}

export const useAgentsConfigLogic = (): UseAgentsConfigLogicResult => {
  const { data: agentsData, loading: loadingAgents, refetch: refetchAgents } = useQuery(GET_AGENTS);

  const [createAgent, { loading: creating }] = useMutation(CREATE_AGENT);
  const [updateAgent, { loading: updating }] = useMutation(UPDATE_AGENT);
  const [deleteAgent] = useMutation(DELETE_AGENT);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const [name, setName] = useState("");
  const [role, setRole] = useState<AgentRole>(AgentRole.SALES);
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.ACTIVE);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [enabledTools, setEnabledTools] = useState<string[]>([]);

  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("chat");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMessage] = useState<string | null>(null);

  const agents: Agent[] = agentsData?.getAgents || [];

  useEffect(() => {
    if (agents.length > 0 && !selectedAgent && !isCreatingNew) {
      handleSelectAgent(agents[0]!);
    }
  }, [agents, selectedAgent, isCreatingNew]);

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsCreatingNew(false);
    setName(agent.name);
    setRole(agent.role);
    setStatus(agent.status as AgentStatus);
    setSystemPrompt(agent.systemPrompt);
    setEnabledTools(agent.enabledTools);
    // Preserves the active sub-tab so the user stays on their current view when switching agents.
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
        : [...prev, toolKey],
    );
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

  const resetForm = () => {
    if (isCreatingNew) {
      if (agents.length > 0) {
        handleSelectAgent(agents[0]!);
      } else {
        setIsCreatingNew(false);
        setSelectedAgent(null);
      }
    } else if (selectedAgent) {
      handleSelectAgent(selectedAgent);
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setToastMsg(null);

    const agentInput = { name, role, status, systemPrompt, enabledTools };

    try {
      if (isCreatingNew) {
        const res = await createAgent({ variables: { input: agentInput } });
        setToastMsg("Agent created successfully!");
        refetchAgents();
        if (res.data?.createAgent) {
          handleSelectAgent(res.data.createAgent);
        }
      } else if (selectedAgent) {
        await updateAgent({
          variables: { input: { id: selectedAgent.id, ...agentInput } },
        });
        setToastMsg("Configuration updated successfully!");
        refetchAgents();
      }
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to save configuration.");
    }
  };

  return {
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
    setErrorMessage,
    setToastMsg,
    handleSelectAgent,
    handleCreateNewClick,
    handleToggleTool,
    handleDeleteClick,
    handleSaveSubmit,
    resetForm,
    refetchAgents,
    isSubmitting: creating || updating,
  };
};
