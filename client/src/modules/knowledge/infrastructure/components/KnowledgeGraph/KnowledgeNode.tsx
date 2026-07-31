import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText, Clock } from 'lucide-react';
import { HierarchyLevel } from '@shared-domain/knowledge';
import {
  CATEGORY_COLORS,
  STATUS_BADGES,
  HIERARCHY_LEVEL_META,
  DEFAULT_HIERARCHY_LEVEL_META,
  HIERARCHY_LEVEL_ICONS,
  truncateText,
  isDraftStatus,
  type KnowledgeGraphNode,
} from './graph-helpers';

const TITLE_MAX_CHARS_INDEX = 100;
const TITLE_MAX_CHARS_DOCUMENT = 80;
const DRAFT_RING_CLASS = 'ring-2 ring-amber-400 dark:ring-amber-500 ring-offset-2 ring-offset-stone-50 dark:ring-offset-stone-950';
const DRAFT_BORDER_CLASS = 'border-dashed border-amber-500 dark:border-amber-400';

const KnowledgeNodeComponent: React.FC<NodeProps<KnowledgeGraphNode>> = ({ data, selected }) => {
  const palette = CATEGORY_COLORS[data.category] ?? CATEGORY_COLORS['__orphan__']!;
  const status = STATUS_BADGES[data.status] ?? STATUS_BADGES['DRAFT']!;
  const levelMeta = HIERARCHY_LEVEL_META[data.hierarchyLevel] ?? DEFAULT_HIERARCHY_LEVEL_META;
  const LevelIcon = HIERARCHY_LEVEL_ICONS[data.hierarchyLevel] ?? FileText;
  const isIndex = data.hierarchyLevel !== HierarchyLevel.DATA;
  const isDraft = isDraftStatus(data.status);

  return (
    <div
      className={[
        'rounded-xl border-2 transition-shadow',
        levelMeta.sizeClass,
        levelMeta.emphasisClass,
        palette.bg,
        isDraft ? DRAFT_BORDER_CLASS : palette.border,
        palette.text,
        selected ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-stone-50 dark:ring-offset-stone-950' : '',
        !selected && isDraft ? DRAFT_RING_CLASS : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Handle type="target" position={Position.Top} className="!bg-stone-400 !w-2 !h-2" />
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-80">
          <LevelIcon className={isIndex ? 'w-3.5 h-3.5' : 'w-3 h-3'} aria-hidden="true" />
          {data.category === '__orphan__' ? 'Unlinked' : data.category}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-[9px] font-bold rounded px-1.5 py-0.5 ${status.className}`}
          data-testid={`status-${data.status}`}
        >
          {isDraft && <Clock className="w-2.5 h-2.5" aria-hidden="true" />}
          {status.label}
        </span>
      </div>
      <p className={`font-semibold leading-tight ${isIndex ? 'font-black' : ''}`} title={data.label}>
        {truncateText(data.label, isIndex ? TITLE_MAX_CHARS_INDEX : TITLE_MAX_CHARS_DOCUMENT)}
      </p>
      <span className="mt-1 block text-[9px] font-medium uppercase tracking-wide opacity-60">
        {levelMeta.label}
      </span>
      <Handle type="source" position={Position.Bottom} className="!bg-stone-400 !w-2 !h-2" />
    </div>
  );
};

export const KnowledgeNode = memo(KnowledgeNodeComponent);
