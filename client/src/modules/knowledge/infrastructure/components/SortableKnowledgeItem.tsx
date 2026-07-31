import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { KnowledgeItem, type KnowledgeListItem } from './KnowledgeItem';

interface SortableKnowledgeItemProps {
  entry: KnowledgeListItem;
  onEdit: (entry: KnowledgeListItem) => void;
  onDelete: (entry: KnowledgeListItem) => void;
}

export const SortableKnowledgeItem: React.FC<SortableKnowledgeItemProps> = ({
  entry,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? ('relative' as const) : ('static' as const),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${
        isDragging ? 'opacity-85 scale-[1.01] shadow-xl ring-2 ring-emerald-500/50 rounded-xl z-20' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-4 right-4 z-10 p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-grab active:cursor-grabbing opacity-60 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <KnowledgeItem entry={entry} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};

export default SortableKnowledgeItem;
