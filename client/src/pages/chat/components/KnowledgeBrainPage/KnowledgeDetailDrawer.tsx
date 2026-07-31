import React from "react";
import { X, Link2, Tag, AlertTriangle } from "lucide-react";
import {
  CATEGORY_COLORS,
  STATUS_BADGES,
  HIERARCHY_LEVEL_META,
  DEFAULT_HIERARCHY_LEVEL_META,
  HIERARCHY_LEVEL_ICONS,
  truncateText,
} from "@modules/knowledge/infrastructure/components/KnowledgeGraph/graph-helpers";
import type { KnowledgeNodeClickPayload } from "@modules/knowledge/infrastructure/components/KnowledgeGraph/KnowledgeGraph";
import { KnowledgeDetailActions } from "./KnowledgeDetailActions";

const CONTENT_PREVIEW_MAX_CHARS = 420;

interface KnowledgeDetailDrawerProps {
  entry: KnowledgeNodeClickPayload | null;
  onClose: () => void;
  isAdmin: boolean;
  onChanged: () => void;
  onEditRequest: (id: string) => void;
}

export const KnowledgeDetailDrawer: React.FC<KnowledgeDetailDrawerProps> = ({
  entry,
  onClose,
  isAdmin,
  onChanged,
  onEditRequest,
}) => {
  if (!entry) return null;

  if (entry.isOrphan) {
    return (
      <aside className="absolute inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl z-20 flex flex-col animate-[fadeIn_0.15s_ease-out]">
        <DrawerHeader onClose={onClose} />
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-wide">Unlinked reference</p>
          </div>
          <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{entry.title}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            A document links to this title, but no knowledge entry exists for it yet.{" "}
            {isAdmin
              ? 'Use "Nueva entrada" with this exact title so the sales agent can resolve this reference.'
              : "Ask an administrator to create it so the sales agent can resolve this reference."}
          </p>
        </div>
      </aside>
    );
  }

  const palette = CATEGORY_COLORS[entry.category ?? ""] ?? CATEGORY_COLORS["__orphan__"]!;
  const status = STATUS_BADGES[entry.status ?? ""] ?? STATUS_BADGES.ACTIVE!;
  const levelMeta = HIERARCHY_LEVEL_META[entry.hierarchyLevel ?? ""] ?? DEFAULT_HIERARCHY_LEVEL_META;
  const LevelIcon = HIERARCHY_LEVEL_ICONS[entry.hierarchyLevel ?? ""];
  const tags = entry.tags ?? [];
  const linkedTitles = entry.linkedTitles ?? [];

  return (
    <aside className="absolute inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl z-20 flex flex-col animate-[fadeIn_0.15s_ease-out]">
      <DrawerHeader onClose={onClose} />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${palette.bg} ${palette.border} ${palette.text}`}>
            {entry.category}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700/60">
            {LevelIcon && <LevelIcon className="w-3 h-3" aria-hidden="true" />}
            {levelMeta.label}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${status.className}`}>
            {status.label}
          </span>
        </div>

        <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 leading-snug">{entry.title}</h2>

        {entry.content && (
          <p className="text-sm text-stone-600 dark:text-stone-400 whitespace-pre-line">
            {truncateText(entry.content, CONTENT_PREVIEW_MAX_CHARS)}
          </p>
        )}

        {tags.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1.5">
              <Tag className="w-3 h-3" aria-hidden="true" />
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-50 text-stone-600 dark:bg-stone-800/60 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1.5">
            <Link2 className="w-3 h-3" aria-hidden="true" />
            Links to ({linkedTitles.length})
          </p>
          {linkedTitles.length > 0 ? (
            <ul className="space-y-1">
              {linkedTitles.map((title) => (
                <li
                  key={title}
                  className="text-xs font-medium px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40"
                >
                  {title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-stone-400 dark:text-stone-500">This entry doesn't reference anything else.</p>
          )}
        </div>

        {entry.id && (
          <KnowledgeDetailActions
            entryId={entry.id}
            entryTitle={entry.title}
            status={entry.status}
            isAdmin={isAdmin}
            onChanged={onChanged}
            onEditRequest={onEditRequest}
            onClose={onClose}
          />
        )}
      </div>
    </aside>
  );
};

const DrawerHeader: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
    <span className="text-xs font-black uppercase tracking-wider text-stone-400">Entry details</span>
    <button
      type="button"
      onClick={onClose}
      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      aria-label="Close details"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);

export default KnowledgeDetailDrawer;
