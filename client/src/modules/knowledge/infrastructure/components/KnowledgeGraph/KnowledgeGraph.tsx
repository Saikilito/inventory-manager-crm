import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type OnNodeDrag,
  BackgroundVariant,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { KNOWLEDGE_GRAPH_QUERY } from '@modules/knowledge/application/queries/knowledge.queries';
import {
  toReactFlowElements,
  nodeMatchesFilters,
  hasActiveFilters,
  computeGraphStats,
  type KnowledgeGraphNode,
  type RawGraphEdge,
  type RawGraphNode,
  type GraphFilters,
  type GraphStats,
  type PositionOverrideMap,
} from './graph-helpers';
import { KnowledgeNode } from './KnowledgeNode';
import { OrphanNode } from './OrphanNode';
import { GraphControls, MiniMapWrapper } from './GraphControls';
import { useGraphFocus } from './useGraphFocus';
import Spinkit from '../../../../../components/Spinkit';

const DIMMED_OPACITY = 0.15;
const MATCHED_OPACITY = 1;
const EMPTY_POSITION_OVERRIDES: PositionOverrideMap = {};

interface KnowledgeGraphResponse {
  knowledgeGraph: {
    nodes: RawGraphNode[];
    edges: RawGraphEdge[];
  };
}

const nodeTypes = {
  knowledge: KnowledgeNode,
  orphan: OrphanNode,
};

export interface KnowledgeNodeClickPayload {
  id?: string;
  title: string;
  isOrphan: boolean;
  category?: string;
  status?: string;
  hierarchyLevel?: string;
  content?: string;
  tags?: string[];
  linkedTitles?: string[];
}

export interface KnowledgeGraphInfo {
  stats: GraphStats;
  matchCount: number | null;
}

interface KnowledgeGraphProps {
  status?: string;
  includeDrafts?: boolean;
  onNodeClick?: (entry: KnowledgeNodeClickPayload) => void;
  filters?: GraphFilters;
  onInfoChange?: (info: KnowledgeGraphInfo) => void;
  positionOverrides?: PositionOverrideMap;
  onNodePositionChange?: (id: string, position: { x: number; y: number }) => void;
}

const GraphFocusEffect: React.FC<{ matchedNodeIds: string[] | null }> = ({ matchedNodeIds }) => {
  useGraphFocus(matchedNodeIds);
  return null;
};

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  status,
  includeDrafts,
  onNodeClick,
  filters,
  onInfoChange,
  positionOverrides = EMPTY_POSITION_OVERRIDES,
  onNodePositionChange,
}) => {
  const { data, loading, error, refetch } = useQuery<KnowledgeGraphResponse>(KNOWLEDGE_GRAPH_QUERY, {
    variables: {
      ...(status ? { status } : {}),
      ...(includeDrafts ? { includeDrafts: true } : {}),
    },
    fetchPolicy: 'cache-and-network',
  });

  const [showMinimap, setShowMinimap] = useState(false);
  const rawNodes = useMemo(() => data?.knowledgeGraph.nodes ?? [], [data]);
  const rawEdges = useMemo(() => data?.knowledgeGraph.edges ?? [], [data]);

  const { nodes: baseNodes, edges: baseEdges } = useMemo<{ nodes: KnowledgeGraphNode[]; edges: Edge[] }>(
    () => toReactFlowElements(rawNodes, rawEdges, positionOverrides),
    [rawNodes, rawEdges, positionOverrides],
  );

  const stats = useMemo<GraphStats>(() => computeGraphStats(rawNodes, rawEdges), [rawNodes, rawEdges]);

  const filtersActive = Boolean(filters && hasActiveFilters(filters));
  const matchedNodeIds = useMemo<string[] | null>(() => {
    if (!filters || !filtersActive) return null;
    return rawNodes.filter((node) => nodeMatchesFilters(node, filters)).map((node) => node.id);
  }, [rawNodes, filters, filtersActive]);
  const matchedIdSet = useMemo(() => (matchedNodeIds ? new Set(matchedNodeIds) : null), [matchedNodeIds]);

  useEffect(() => {
    onInfoChange?.({ stats, matchCount: matchedNodeIds ? matchedNodeIds.length : null });
  }, [stats, matchedNodeIds, onInfoChange]);

  const displayNodes = useMemo<KnowledgeGraphNode[]>(() => {
    if (!matchedIdSet) return baseNodes;
    return baseNodes.map((node) => ({
      ...node,
      style: { ...node.style, opacity: matchedIdSet.has(node.id) ? MATCHED_OPACITY : DIMMED_OPACITY },
    }));
  }, [baseNodes, matchedIdSet]);

  const edges = useMemo<Edge[]>(() => {
    if (!matchedIdSet) return baseEdges;
    return baseEdges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: matchedIdSet.has(edge.source) || matchedIdSet.has(edge.target) ? MATCHED_OPACITY : DIMMED_OPACITY,
      },
    }));
  }, [baseEdges, matchedIdSet]);

  const [nodes, setNodes, onNodesChange] = useNodesState<KnowledgeGraphNode>(displayNodes);
  useEffect(() => {
    setNodes(displayNodes);
  }, [displayNodes, setNodes]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node: Node) => {
      if (node.type === 'orphan') {
        onNodeClick?.({ title: String((node.data as { label?: string })?.label ?? node.id), isOrphan: true });
        return;
      }
      const source = rawNodes.find((n) => n.id === node.id);
      const linkedTitles = rawEdges.filter((edge) => edge.sourceId === node.id).map((edge) => edge.targetTitle);
      onNodeClick?.({
        id: node.id,
        title: source?.title ?? String((node.data as { label?: string })?.label ?? node.id),
        isOrphan: false,
        category: source?.category,
        status: source?.status,
        hierarchyLevel: source?.hierarchyLevel,
        content: source?.content,
        tags: source?.tags,
        linkedTitles,
      });
    },
    [onNodeClick, rawNodes, rawEdges],
  );

  const handleNodeDragStop: OnNodeDrag<KnowledgeGraphNode> = useCallback(
    (_event, node) => {
      if (node.draggable === false) return;
      onNodePositionChange?.(node.id, node.position);
    },
    [onNodePositionChange],
  );

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Spinkit />
        <p className="text-sm text-stone-500 dark:text-stone-400">Loading knowledge graph…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4 text-sm text-red-800 dark:text-red-300">
        <b>Error loading graph:</b> {error.message}
        <button
          type="button"
          onClick={() => void refetch()}
          className="ml-3 inline-flex items-center text-xs font-semibold underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (rawNodes.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
        <p className="text-stone-500 dark:text-stone-400">
          No knowledge entries to visualize. Approve some drafts to populate the graph.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[640px] bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={handleNodeClick}
          onNodeDragStop={handleNodeDragStop}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.12}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} />
          <Controls
            className="!bg-white/80 dark:!bg-stone-900/80 !border !border-stone-200 dark:!border-stone-800 !rounded-xl !shadow-sm"
            showInteractive={false}
          />
          <MiniMapWrapper show={showMinimap} />
        </ReactFlow>
        <GraphFocusEffect matchedNodeIds={matchedNodeIds} />
        <GraphControls
          showMinimap={showMinimap}
          onToggleMinimap={() => setShowMinimap((value) => !value)}
        />
      </ReactFlowProvider>
    </div>
  );
};

export default KnowledgeGraph;
