import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CATEGORY_COLORS, STATUS_BADGES, type KnowledgeGraphNode } from './graph-helpers';

const truncate = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max).trimEnd()}...`;

const KnowledgeNodeComponent: React.FC<NodeProps<KnowledgeGraphNode>> = ({ data, selected }) => {
  const palette = CATEGORY_COLORS[data.category] ?? CATEGORY_COLORS['__orphan__']!;
  const status = STATUS_BADGES[data.status] ?? STATUS_BADGES['DRAFT']!;

  return (
    <div
      className={[
        'rounded-xl border-2 px-3 py-2 min-w-[200px] max-w-[240px] shadow-sm transition-shadow',
        palette.bg,
        palette.border,
        palette.text,
        selected ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-stone-50 dark:ring-offset-stone-950' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Handle type="target" position={Position.Top} className="!bg-stone-400 !w-2 !h-2" />
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
          {data.category === '__orphan__' ? 'Unlinked' : data.category}
        </span>
        <span
          className={`text-[9px] font-bold rounded px-1.5 py-0.5 ${status.className}`}
          data-testid={`status-${data.status}`}
        >
          {status.label}
        </span>
      </div>
      <p className="text-sm font-semibold leading-tight" title={data.label}>
        {truncate(data.label, 80)}
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-stone-400 !w-2 !h-2" />
    </div>
  );
};

export const KnowledgeNode = memo(KnowledgeNodeComponent);
