import React from "react";
import { Plus, RotateCcw, FileClock } from "lucide-react";

interface GraphToolbarProps {
  includeDrafts: boolean;
  onToggleIncludeDrafts: () => void;
  onCreateClick: () => void;
  onResetPositions: () => void;
  hasPositionOverrides: boolean;
}

const draftToggleClass = (active: boolean): string =>
  [
    "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold border transition-colors shadow-xs shrink-0",
    active
      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50"
      : "bg-white text-stone-700 border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800",
  ].join(" ");

/**
 * Admin-only graph header controls: showing/hiding pending drafts, creating
 * a new entry, and clearing manually-dragged node positions. Rendered next
 * to the Legend toggle on the Knowledge Brain page; not shown to non-admins
 * since the mutations behind these actions are server-rejected for them.
 */
export const GraphToolbar: React.FC<GraphToolbarProps> = ({
  includeDrafts,
  onToggleIncludeDrafts,
  onCreateClick,
  onResetPositions,
  hasPositionOverrides,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onToggleIncludeDrafts}
        aria-pressed={includeDrafts}
        className={draftToggleClass(includeDrafts)}
        title={includeDrafts ? "Ocultar borradores pendientes" : "Mostrar borradores pendientes"}
      >
        <FileClock className="w-3.5 h-3.5" />
        {includeDrafts ? "Borradores visibles" : "Mostrar borradores"}
      </button>

      <button
        type="button"
        onClick={onResetPositions}
        disabled={!hasPositionOverrides}
        className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Restablecer posiciones arrastradas manualmente"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Restablecer posiciones
      </button>

      <button
        type="button"
        onClick={onCreateClick}
        className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
        Nueva entrada
      </button>
    </div>
  );
};

export default GraphToolbar;
