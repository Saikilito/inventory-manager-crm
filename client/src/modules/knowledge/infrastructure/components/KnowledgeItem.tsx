import React, { Fragment, useState } from 'react';
import { match } from 'ts-pattern';
import { Pencil, Trash2, Link2 } from 'lucide-react';
import { KnowledgeCategory, HierarchyLevel } from '@shared-domain/knowledge';

const CATEGORY_STYLES: Record<string, string> = {
  [KnowledgeCategory.SALES]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50',
  [KnowledgeCategory.PRODUCTS]: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50',
  [KnowledgeCategory.COMPANY]: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50',
  [KnowledgeCategory.CUSTOMER_SERVICE]: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50',
};

const HIERARCHY_LABELS: Record<string, string> = {
  [HierarchyLevel.ROOT]: 'Root',
  [HierarchyLevel.DOMAIN]: 'Domain',
  [HierarchyLevel.TOPIC]: 'Topic',
  [HierarchyLevel.DATA]: 'Data',
};

const formatRelativeTime = (iso?: string): string => {
  if (!iso) return 'Never updated';
  const updated = new Date(iso);
  if (isNaN(updated.getTime())) return 'Never updated';

  const diffMs = Date.now() - updated.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays < 0) return 'just now';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;

  return updated.toISOString().slice(0, 10);
};

export interface KnowledgeListItem {
  _id: string;
  title: string;
  content: string;
  category: string;
  metadata: {
    hierarchyLevel: string;
    tags: string[];
    createdBy: string;
    updatedBy?: string;
    lastVerified?: string;
    productId?: string;
  };
  wikiLinks: Array<{ title: string; url?: string }>;
  status: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface KnowledgeItemProps {
  entry: KnowledgeListItem;
  onEdit: (entry: KnowledgeListItem) => void;
  onDelete: (entry: KnowledgeListItem) => void;
}

const truncate = (text: string, maxChars: number): string => {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}...`;
};

export const KnowledgeItem: React.FC<KnowledgeItemProps> = ({ entry, onEdit, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const categoryStyle = CATEGORY_STYLES[entry.category] ?? 'bg-stone-100 text-stone-700 border-stone-200';
  const hierarchyLabel = HIERARCHY_LABELS[entry.metadata.hierarchyLevel] ?? entry.metadata.hierarchyLevel;
  const tags = entry.metadata.tags || [];
  const wikiLinks = entry.wikiLinks || [];

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-5 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-md transition-all duration-200">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${categoryStyle}`}
        >
          {entry.category}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700/60">
          {hierarchyLabel}
        </span>
        {entry.status && entry.status !== 'ACTIVE' && (
          <span
            className={[
              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
              entry.status === 'DRAFT'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200 dark:border-amber-800/50'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/50',
            ].join(' ')}
          >
            {entry.status}
          </span>
        )}
        {!entry.isActive && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800/50">
            INACTIVE
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2 leading-snug">
        {entry.title}
      </h3>

      <p className="text-sm text-stone-600 dark:text-stone-400 whitespace-pre-line">
        {truncate(entry.content, 240)}
      </p>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-50 text-stone-600 dark:bg-stone-800/60 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/40"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {wikiLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {match(wikiLinks.length > 0)
            .with(true, () => (
              <Fragment>
                <span className="inline-flex items-center text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                  <Link2 className="w-3 h-3 mr-1" />
                  Links:
                </span>
                {wikiLinks.slice(0, 4).map((link) => (
                  <span
                    key={link.title}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40"
                  >
                    {link.title}
                  </span>
                ))}
              </Fragment>
            ))
            .otherwise(() => null)}
        </div>
      )}

      {confirmDelete ? (
        <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 animate-[fadeIn_0.15s_ease-out]">
          <span className="text-xs font-semibold text-red-800 dark:text-red-300">
            ¿Confirmar eliminación?
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                onDelete(entry);
              }}
              className="inline-flex items-center h-8 px-3 rounded-md text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none"
            >
              Sí, eliminar
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="inline-flex items-center h-8 px-3 rounded-md text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 transition-colors focus:outline-none"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800/60 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-stone-500 dark:text-stone-400">
            Updated {formatRelativeTime(entry.updatedAt)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeItem;
