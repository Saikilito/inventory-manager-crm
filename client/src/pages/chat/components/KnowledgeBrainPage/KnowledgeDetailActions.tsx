import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { Check, X, Pencil, Trash2 } from "lucide-react";
import { isDraftStatus } from "@modules/knowledge/infrastructure/components/KnowledgeGraph/graph-helpers";
import {
  KNOWLEDGE_APPROVE,
  KNOWLEDGE_REJECT,
  DELETE_KNOWLEDGE,
  KNOWLEDGE_GRAPH_QUERY_NAME,
} from "@modules/knowledge/application/queries/knowledge.queries";

type ActionKind = "approve" | "reject" | null;

interface KnowledgeDetailActionsProps {
  entryId: string;
  entryTitle: string;
  status?: string;
  isAdmin: boolean;
  onChanged: () => void;
  onEditRequest: (id: string) => void;
  onClose: () => void;
}

const CONFIRM_MESSAGES: Record<Exclude<ActionKind, null>, (title: string) => string> = {
  approve: (title) => `¿Aprobar "${title}"? Pasará a estar ACTIVA y visible para el agente de ventas.`,
  reject: (title) => `¿Rechazar "${title}"? Se marcará como RECHAZADA y desaparecerá del grafo.`,
};

export const KnowledgeDetailActions: React.FC<KnowledgeDetailActionsProps> = ({
  entryId,
  entryTitle,
  status,
  isAdmin,
  onChanged,
  onEditRequest,
  onClose,
}) => {
  const [approveKnowledge, { loading: approving }] = useMutation(KNOWLEDGE_APPROVE);
  const [rejectKnowledge, { loading: rejecting }] = useMutation(KNOWLEDGE_REJECT);
  const [deleteKnowledge, { loading: deleting }] = useMutation(DELETE_KNOWLEDGE, {
    refetchQueries: [KNOWLEDGE_GRAPH_QUERY_NAME, 'KnowledgeList'],
  });
  const [activeAction, setActiveAction] = useState<ActionKind>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAdmin) return null;

  const isDraft = isDraftStatus(status);
  const busy = approving || rejecting || deleting;

  const handleDelete = async () => {
    setErrorMessage(null);
    try {
      const result = await deleteKnowledge({ variables: { _id: entryId } });
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0]?.message ?? "Error al eliminar");
      }
      onChanged();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error al eliminar la entrada");
    } finally {
      setConfirmDelete(false);
    }
  };

  const runAction = async (kind: Exclude<ActionKind, null>) => {
    if (!window.confirm(CONFIRM_MESSAGES[kind](entryTitle))) return;
    setActiveAction(kind);
    setErrorMessage(null);
    try {
      const mutate = kind === "approve" ? approveKnowledge : rejectKnowledge;
      const result = await mutate({ variables: { _id: entryId } });
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0]?.message ?? "La acción falló");
      }
      onChanged();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "La acción falló");
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
      {errorMessage && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {confirmDelete ? (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 rounded-xl space-y-2 animate-[fadeIn_0.15s_ease-out]">
          <p className="text-xs font-semibold text-red-800 dark:text-red-300">
            ¿Confirmar eliminación permanente de "{entryTitle}"?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={busy}
              className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? "Eliminando…" : "Sí, eliminar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={busy}
              className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onEditRequest(entryId)}
            className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700/60 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Editar
          </button>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/30 transition-colors focus:outline-none"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Eliminar
          </button>

          {isDraft && (
            <>
              <button
                type="button"
                onClick={() => void runAction("reject")}
                disabled={busy}
                className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/40 transition-colors disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                {activeAction === "reject" ? "Rechazando…" : "Rechazar"}
              </button>
              <button
                type="button"
                onClick={() => void runAction("approve")}
                disabled={busy}
                className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                {activeAction === "approve" ? "Aprobando…" : "Aprobar"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeDetailActions;
