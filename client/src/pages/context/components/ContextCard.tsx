import React from 'react';
import { Tag, Edit3, Trash2 } from 'lucide-react';
import type { GQLContext } from '@modules/context/infrastructure/graphql/types';

const ATTRIBUTE_TYPES: Record<string, { label: string; color: string }> = {
  STRING: { label: 'Text', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  NUMBER: { label: 'Number', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  BOOLEAN: { label: 'Boolean', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  MULTIPLE: { label: 'Multiple', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

interface ContextCardProps {
  ctx: GQLContext;
  onEdit: (ctx: GQLContext) => void;
  onDelete: (id: string, name: string) => void;
}

export const ContextCard: React.FC<ContextCardProps> = ({ ctx, onEdit, onDelete }) => {
  return (
    <article
      className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden hover:border-stone-300 dark:hover:border-stone-700 transition-all shadow-sm hover:shadow-md"
    >
      {/* Context Header */}
      <div className="p-5 border-b border-stone-100 dark:border-stone-800/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <Tag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                {ctx.name}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {ctx.attributes.length} attribute{ctx.attributes.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(ctx)}
              className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label={`Edit ${ctx.name}`}
            >
              <Edit3 className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            </button>
            <button
              onClick={() => onDelete(ctx._id, ctx.name)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              aria-label={`Delete ${ctx.name}`}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Attributes */}
      {ctx.attributes.length > 0 ? (
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {ctx.attributes.slice(0, 5).map((attr, i) => {
              const typeInfo = ATTRIBUTE_TYPES[attr.type] || ATTRIBUTE_TYPES.STRING;
              return (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/60 text-xs font-medium text-stone-700 dark:text-stone-300"
                >
                  <span className="truncate max-w-[100px]">{attr.label || attr.name}</span>
                  {attr.required && (
                    <span className="text-red-500">*</span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                </div>
              );
            })}
            {ctx.attributes.length > 5 && (
              <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/60 text-xs font-medium text-stone-500 dark:text-stone-400">
                +{ctx.attributes.length - 5} more
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-5">
          <p className="text-xs text-stone-400 dark:text-stone-500 italic">
            No attributes defined
          </p>
        </div>
      )}
    </article>
  );
};
