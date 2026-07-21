import React, { useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import KnowledgeList from "@modules/knowledge/infrastructure/components/KnowledgeList";
import KnowledgeForm from "@modules/knowledge/infrastructure/components/KnowledgeForm";

type PanelMode = "list" | "create" | "edit";

export const KnowledgeBrainPanel: React.FC = () => {
  const [mode, setMode] = useState<PanelMode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreateClick = () => {
    setEditingId(null);
    setMode("create");
  };

  const handleSaved = (_message: string) => {
    setMode("list");
    setEditingId(null);
  };

  const handleCancel = () => {
    setMode("list");
    setEditingId(null);
  };

  if (mode === "list") {
    return (
      <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              Knowledge Brain
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Company knowledge injected into this agent's responses via the Cognitive Router.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateClick}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Entry
          </button>
        </div>
        <div className="border-t border-stone-200 dark:border-stone-800 pt-4">
          <KnowledgeList session={{ _id: "", role: "ADMIN" as never, name: "" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to list
        </button>
      </div>
      <KnowledgeForm
        mode={mode}
        {...(editingId ? { initialValues: { _id: editingId, category: "", title: "", content: "", hierarchyLevel: "", tags: [], wikiLinks: [] } } : {})}
        onClose={handleCancel}
        onSaved={handleSaved}
        onError={(msg: string) => console.error("[knowledge-brain]", msg)}
      />
    </div>
  );
};

export default KnowledgeBrainPanel;
