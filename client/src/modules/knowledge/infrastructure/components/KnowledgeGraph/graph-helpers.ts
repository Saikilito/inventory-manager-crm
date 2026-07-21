import type { Edge, Node } from '@xyflow/react';
import { KnowledgeCategory } from '@shared-domain/knowledge';

export interface KnowledgeGraphNodeData {
  label: string;
  category: string;
  status: string;
  resolved: boolean;
  isOrphan: boolean;
  [key: string]: unknown;
}

export type KnowledgeGraphNode = Node<KnowledgeGraphNodeData>;

export const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  [KnowledgeCategory.SALES]: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-400 dark:border-blue-700',
    text: 'text-blue-900 dark:text-blue-200',
  },
  [KnowledgeCategory.PRODUCTS]: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-400 dark:border-emerald-700',
    text: 'text-emerald-900 dark:text-emerald-200',
  },
  [KnowledgeCategory.COMPANY]: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-400 dark:border-purple-700',
    text: 'text-purple-900 dark:text-purple-200',
  },
  [KnowledgeCategory.CUSTOMER_SERVICE]: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-400 dark:border-amber-700',
    text: 'text-amber-900 dark:text-amber-200',
  },
  __orphan__: {
    bg: 'bg-stone-200 dark:bg-stone-800',
    border: 'border-stone-400 dark:border-stone-600 border-dashed',
    text: 'text-stone-700 dark:text-stone-300',
  },
};

export const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: 'DRAFT',
    className: 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100',
  },
  ACTIVE: {
    label: 'ACTIVE',
    className: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100',
  },
  REJECTED: {
    label: 'REJECTED',
    className: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
  },
};

export interface RawGraphNode {
  id: string;
  title: string;
  category: string;
  status: string;
}

export interface RawGraphEdge {
  sourceId: string;
  targetTitle: string;
  targetId?: string | null;
  resolved: boolean;
}

const GRID_COLUMNS = 4;
const GRID_ROW_HEIGHT = 140;
const GRID_COL_WIDTH = 280;

const buildLayout = (count: number): { x: number; y: number }[] => {
  return Array.from({ length: count }, (_, index) => {
    const col = index % GRID_COLUMNS;
    const row = Math.floor(index / GRID_COLUMNS);
    return { x: col * GRID_COL_WIDTH, y: row * GRID_ROW_HEIGHT };
  });
};

export const toReactFlowElements = (
  rawNodes: RawGraphNode[],
  rawEdges: RawGraphEdge[],
): { nodes: KnowledgeGraphNode[]; edges: Edge[] } => {
  const knownIds = new Set(rawNodes.map((n) => n.id));
  const orphanTitles = new Set<string>();
  for (const edge of rawEdges) {
    if (!edge.resolved && edge.sourceId && !knownIds.has(edge.sourceId)) continue;
    if (!edge.resolved) {
      orphanTitles.add(edge.targetTitle);
    }
  }

  const layout = buildLayout(rawNodes.length + orphanTitles.size);

  const nodes: KnowledgeGraphNode[] = [];

  rawNodes.forEach((node, index) => {
    const pos = layout[index] ?? { x: 0, y: 0 };
    nodes.push({
      id: node.id,
      type: 'knowledge',
      position: pos,
      data: {
        label: node.title,
        category: node.category,
        status: node.status,
        resolved: true,
        isOrphan: false,
      },
    });
  });

  let orphanIndex = 0;
  for (const title of orphanTitles) {
    const orphanId = `orphan::${title}`;
    const pos = layout[rawNodes.length + orphanIndex] ?? { x: 0, y: 0 };
    nodes.push({
      id: orphanId,
      type: 'orphan',
      position: pos,
      data: {
        label: title,
        category: '__orphan__',
        status: 'DRAFT',
        resolved: false,
        isOrphan: true,
      },
    });
    orphanIndex += 1;
  }

  const edges: Edge[] = rawEdges.map((edge, index) => {
    const targetId = edge.resolved
      ? edge.targetId ?? `orphan::${edge.targetTitle}`
      : `orphan::${edge.targetTitle}`;

    return {
      id: `edge::${edge.sourceId}::${index}`,
      source: edge.sourceId,
      target: targetId,
      animated: !edge.resolved,
      style: edge.resolved
        ? { stroke: '#10b981', strokeWidth: 2 }
        : { stroke: '#a8a29e', strokeWidth: 1.5, strokeDasharray: '6 4' },
    };
  });

  return { nodes, edges };
};

export const getNodeColor = (category: string) =>
  CATEGORY_COLORS[category] ?? CATEGORY_COLORS['__orphan__']!;
