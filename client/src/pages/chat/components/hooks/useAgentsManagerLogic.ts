import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_AGENTS } from "../../../../modules/chat/infrastructure/graphql/queries";
import {
  CREATE_AGENT,
  UPDATE_AGENT,
  DELETE_AGENT,
  ASSIGN_AGENT_TO_SESSION_MODAL,
} from "../../../../modules/chat/infrastructure/graphql/mutations";
import { Agent } from "../../types";
import { AgentRole, AgentStatus } from "@shared-domain/chat/agent.entity";

export interface UseAgentsManagerLogicProps {
  isOpen: boolean;
  whatsappId: string;
  onAgentAssigned?: () => void;
}

export const useAgentsManagerLogic = ({
  isOpen,
  whatsappId,
  onAgentAssigned,
}: UseAgentsManagerLogicProps) => {
  const { data, loading, refetch } = useQuery(GET_AGENTS, {
    skip: !isOpen,
  });

  const [createAgent, { loading: creating }] = useMutation(CREATE_AGENT);
  const [updateAgent, { loading: updating }] = useMutation(UPDATE_AGENT);
  const [deleteAgent] = useMutation(DELETE_AGENT);
  const [assignAgentToSession, { loading: assigning }] = useMutation(
    ASSIGN_AGENT_TO_SESSION_MODAL,
  );

  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState<AgentRole>(AgentRole.SALES);
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.ACTIVE);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [enabledTools, setEnabledTools] = useState<string[]>([]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setRole(AgentRole.SALES);
    setStatus(AgentStatus.ACTIVE);
    setSystemPrompt("");
    setEnabledTools([]);
    setEditingAgent(null);
    setShowForm(false);
  };

  const handleEditClick = (agent: Agent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setRole(agent.role);
    setStatus(agent.status as AgentStatus);
    setSystemPrompt(agent.systemPrompt);
    setEnabledTools(agent.enabledTools);
    setShowForm(true);
  };

  const handleToggleTool = (toolKey: string) => {
    setEnabledTools((prev) =>
      prev.includes(toolKey)
        ? prev.filter((t) => t !== toolKey)
        : [...prev, toolKey],
    );
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const input = {
      name,
      role,
      status,
      systemPrompt,
      enabledTools,
    };

    try {
      if (editingAgent) {
        await updateAgent({
          variables: {
            input: {
              id: editingAgent.id,
              ...input,
            },
          },
        });
        setToastMsg("Agent updated successfully!");
      } else {
        await createAgent({
          variables: {
            input,
          },
        });
        setToastMsg("Agent created successfully!");
      }
      refetch();
      resetForm();
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to save Agent.");
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to delete this AI Agent?")) return;
    try {
      await deleteAgent({
        variables: { id },
      });
      setToastMsg("Agent deleted successfully.");
      refetch();
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to delete Agent.");
    }
  };

  const handleAssignClick = async (agentId: string | null) => {
    if (!whatsappId) return;
    try {
      await assignAgentToSession({
        variables: {
          whatsappId,
          agentId,
        },
      });
      setToastMsg(
        agentId
          ? "AI Agent assigned to active chat session!"
          : "AI Agent unassigned from active session.",
      );
      if (onAgentAssigned) {
        onAgentAssigned();
      }
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to assign Agent.");
    }
  };

  return {
    agents: (data?.getAgents || []) as Agent[],
    loading,
    creating,
    updating,
    assigning,
    showForm,
    setShowForm,
    name,
    setName,
    role,
    setRole,
    status,
    setStatus,
    systemPrompt,
    setSystemPrompt,
    enabledTools,
    toastMsg,
    errorMsg,
    resetForm,
    handleEditClick,
    handleToggleTool,
    handleSaveSubmit,
    handleDeleteClick,
    handleAssignClick,
  };
};
