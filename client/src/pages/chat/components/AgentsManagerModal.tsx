import React from "react";
import { X, Cpu, CheckCircle, AlertCircle } from "lucide-react";
import { useAgentsManagerLogic } from "./hooks/useAgentsManagerLogic";
import { AgentForm } from "./AgentForm";
import { AgentList } from "./AgentList";

export interface AgentsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappId: string;
  assignedAgentId?: string | null;
  onAgentAssigned?: () => void;
}

export const AgentsManagerModal: React.FC<AgentsManagerModalProps> = ({
  isOpen,
  onClose,
  whatsappId,
  assignedAgentId,
  onAgentAssigned,
}) => {
  const logic = useAgentsManagerLogic({
    isOpen,
    whatsappId,
    onAgentAssigned,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              AI Agents Configuration Hub
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Create, edit, and assign intelligent customized assistants with
              modular CRM capabilities.
            </p>
          </div>
          <button
            onClick={() => {
              logic.resetForm();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {logic.toastMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{logic.toastMsg}</span>
            </div>
          )}

          {logic.errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-800 dark:text-red-400 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{logic.errorMsg}</span>
            </div>
          )}

          {logic.showForm ? (
            <AgentForm {...logic} />
          ) : (
            <AgentList
              agents={logic.agents}
              loading={logic.loading}
              assignedAgentId={assignedAgentId}
              whatsappId={whatsappId}
              assigning={logic.assigning}
              setShowForm={logic.setShowForm}
              handleEditClick={logic.handleEditClick}
              handleDeleteClick={logic.handleDeleteClick}
              handleAssignClick={logic.handleAssignClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentsManagerModal;
