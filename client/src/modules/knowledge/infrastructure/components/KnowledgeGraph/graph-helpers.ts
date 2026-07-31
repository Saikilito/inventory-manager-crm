import type { Edge, Node } from '@xyflow/react';
import { Globe2, Network, ListTree, FileText, type LucideIcon } from 'lucide-react';
import { KnowledgeCategory, HierarchyLevel, KnowledgeStatus } from '@shared-domain/knowledge';
import { computeRadialPositions, type RadialLayoutEdge, type RadialLayoutNode } from './radial-layout';

export interface KnowledgeGraphNodeData {
  label: string;
  category: string;
  status: string;
  hierarchyLevel: string;
  content: string;
  tags: string[];
  resolved: boolean;
  isOrphan: boolean;
  [key: string]: unknown;
}

export type KnowledgeGraphNode = Node<KnowledgeGraphNodeData>;

export const truncateText = (text: string, maxChars: number): string =>
  text.length <= maxChars ? text : `${text.slice(0, maxChars).trimEnd()}…`;

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

export interface HierarchyLevelMeta {
  label: string;
  description: string;
  sizeClass: string;
  emphasisClass: string;
}

export const HIERARCHY_LEVEL_META: Record<string, HierarchyLevelMeta> = {
  [HierarchyLevel.ROOT]: {
    label: 'Root Index',
    description: 'Top-level directory the agent opens first',
    sizeClass: 'min-w-[230px] max-w-[300px] px-5 py-4 text-base',
    emphasisClass: 'shadow-lg shadow-stone-900/10 dark:shadow-black/30',
  },
  [HierarchyLevel.DOMAIN]: {
    label: 'Domain Index',
    description: 'Groups related topics under one subject',
    sizeClass: 'min-w-[210px] max-w-[270px] px-4 py-3 text-sm',
    emphasisClass: 'shadow-md shadow-stone-900/5 dark:shadow-black/20',
  },
  [HierarchyLevel.TOPIC]: {
    label: 'Topic Index',
    description: 'Points the agent to specific documents',
    sizeClass: 'min-w-[190px] max-w-[240px] px-3.5 py-2.5 text-sm',
    emphasisClass: 'shadow-sm',
  },
  [HierarchyLevel.DATA]: {
    label: 'Document',
    description: 'Leaf-level content the agent reads verbatim',
    sizeClass: 'min-w-[170px] max-w-[210px] px-3 py-2 text-xs',
    emphasisClass: '',
  },
};

export const DEFAULT_HIERARCHY_LEVEL_META: HierarchyLevelMeta = HIERARCHY_LEVEL_META[HierarchyLevel.DATA]!;

export const HIERARCHY_LEVEL_ICONS: Record<string, LucideIcon> = {
  [HierarchyLevel.ROOT]: Globe2,
  [HierarchyLevel.DOMAIN]: Network,
  [HierarchyLevel.TOPIC]: ListTree,
  [HierarchyLevel.DATA]: FileText,
};

export interface RawGraphNode {
  id: string;
  title: string;
  category: string;
  status: string;
  hierarchyLevel: string;
  content?: string;
  tags?: string[];
}

export interface RawGraphEdge {
  sourceId: string;
  targetTitle: string;
  targetId?: string | null;
  resolved: boolean;
}

const EMPTY_CONTENT = '';
const EMPTY_TAGS: string[] = [];

export type PositionOverrideMap = Record<string, { x: number; y: number }>;

const EMPTY_POSITION_OVERRIDES: PositionOverrideMap = {};

export const isDraggableHierarchyLevel = (_hierarchyLevel: string): boolean => true;

export const isDraftStatus = (status?: string): boolean => status === KnowledgeStatus.DRAFT;

const buildOrphanTitles = (rawNodes: RawGraphNode[], rawEdges: RawGraphEdge[]): Set<string> => {
  const knownIds = new Set(rawNodes.map((n) => n.id));
  const orphanTitles = new Set<string>();
  for (const edge of rawEdges) {
    if (!edge.resolved && edge.sourceId && !knownIds.has(edge.sourceId)) continue;
    if (!edge.resolved) {
      orphanTitles.add(edge.targetTitle);
    }
  }
  return orphanTitles;
};

export const toReactFlowElements = (
  rawNodes: RawGraphNode[],
  rawEdges: RawGraphEdge[],
  positionOverrides: PositionOverrideMap = EMPTY_POSITION_OVERRIDES,
): { nodes: KnowledgeGraphNode[]; edges: Edge[] } => {
  const orphanTitles = buildOrphanTitles(rawNodes, rawEdges);

  const layoutNodes: RadialLayoutNode[] = [
    ...rawNodes.map((node) => ({ id: node.id, hierarchyLevel: node.hierarchyLevel, isOrphan: false })),
    ...Array.from(orphanTitles, (title) => ({ id: `orphan::${title}`, hierarchyLevel: '', isOrphan: true })),
  ];
  const layoutEdges: RadialLayoutEdge[] = rawEdges.map((edge) => ({
    source: edge.sourceId,
    target: edge.resolved ? edge.targetId ?? `orphan::${edge.targetTitle}` : `orphan::${edge.targetTitle}`,
  }));
  const positionById = computeRadialPositions(layoutNodes, layoutEdges);
  const resolvePosition = (id: string) => positionOverrides[id] ?? positionById.get(id) ?? { x: 0, y: 0 };

  const nodes: KnowledgeGraphNode[] = rawNodes.map((node) => ({
    id: node.id,
    type: 'knowledge',
    position: resolvePosition(node.id),
    draggable: isDraggableHierarchyLevel(node.hierarchyLevel),
    data: {
      label: node.title,
      category: node.category,
      status: node.status,
      hierarchyLevel: node.hierarchyLevel,
      content: node.content ?? EMPTY_CONTENT,
      tags: node.tags ?? EMPTY_TAGS,
      resolved: true,
      isOrphan: false,
    },
  }));

  for (const title of orphanTitles) {
    const orphanId = `orphan::${title}`;
    nodes.push({
      id: orphanId,
      type: 'orphan',
      position: resolvePosition(orphanId),
      draggable: true,
      data: {
        label: title,
        category: '__orphan__',
        status: 'DRAFT',
        hierarchyLevel: '',
        content: EMPTY_CONTENT,
        tags: EMPTY_TAGS,
        resolved: false,
        isOrphan: true,
      },
    });
  }

  const edges: Edge[] = rawEdges.map((edge, index) => {
    const targetId = edge.resolved
      ? edge.targetId ?? `orphan::${edge.targetTitle}`
      : `orphan::${edge.targetTitle}`;

    return {
      id: `edge::${edge.sourceId}::${index}`,
      source: edge.sourceId,
      target: targetId,
      animated: true,
      style: edge.resolved
        ? { stroke: '#10b981', strokeWidth: 2 }
        : { stroke: '#a8a29e', strokeWidth: 1.5, strokeDasharray: '6 4' },
    };
  });

  return { nodes, edges };
};

export interface GraphFilters {
  searchText?: string;
  category?: string;
  status?: string;
  hierarchyLevel?: string;
}

const normalizeSearchText = (value: string): string => value.trim().toLowerCase();

export const hasActiveFilters = (filters: GraphFilters): boolean =>
  Boolean(filters.searchText?.trim() || filters.category || filters.status || filters.hierarchyLevel);

export const nodeMatchesFilters = (node: RawGraphNode, filters: GraphFilters): boolean => {
  const searchText = filters.searchText ? normalizeSearchText(filters.searchText) : '';
  if (searchText && !normalizeSearchText(node.title).includes(searchText)) return false;
  if (filters.category && node.category !== filters.category) return false;
  if (filters.status && node.status !== filters.status) return false;
  if (filters.hierarchyLevel && node.hierarchyLevel !== filters.hierarchyLevel) return false;
  return true;
};

export interface GraphStats {
  totalNodes: number;
  totalIndices: number;
  totalDocuments: number;
  unresolvedCount: number;
}

export const computeGraphStats = (rawNodes: RawGraphNode[], rawEdges: RawGraphEdge[]): GraphStats => {
  const totalDocuments = rawNodes.filter((node) => node.hierarchyLevel === HierarchyLevel.DATA).length;
  const unresolvedTitles = new Set(rawEdges.filter((edge) => !edge.resolved).map((edge) => edge.targetTitle));

  return {
    totalNodes: rawNodes.length,
    totalIndices: rawNodes.length - totalDocuments,
    totalDocuments,
    unresolvedCount: unresolvedTitles.size,
  };
};
