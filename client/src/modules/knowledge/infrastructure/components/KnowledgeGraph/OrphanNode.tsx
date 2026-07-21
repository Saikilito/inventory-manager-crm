import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Plus } from 'lucide-react';
import { CATEGORY_COLORS, type KnowledgeGraphNode } from './graph-helpers';

interface OrphanNodeProps extends NodeProps<KnowledgeGraphNode> {
  onCreate?: (title: string) => void;
}

const OrphanNodeComponent: React.FC<OrphanNodeProps> = ({ data, onCreate }) => {
  const palette = CATEGORY_COLORS['__orphan__']!;
  const handleCreate = () => onCreate?.(data.label);

  return (
    <div
      className={[
        'rounded-xl border-2 border-dashed px-3 py-2 min-w-[200px] max-w-[240px] shadow-sm',
        palette.bg,
        palette.border,
        palette.text,
      ].join(' ')}
    >
      <Handle type="target" position={Position.Top} className="!bg-stone-400 !w-2 !h-2" />
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Orphan</span>
        <span className="text-[9px] font-bold rounded px-1.5 py-0.5 bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-100">
          UNLINKED
        </span>
      </div>
      <p className="text-sm font-semibold leading-tight" title={data.label}>
        {data.label}
      </p>
      <button
        type="button"
        onClick={handleCreate}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
      >
        <Plus className="w-3 h-3" />
        Create entry
      </button>
    </div>
  );
};

export const OrphanNode = memo(OrphanNodeComponent);
