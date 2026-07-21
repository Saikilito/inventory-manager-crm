import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  ReactFlow,
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeMouseHandler,
  BackgroundVariant,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { KNOWLEDGE_GRAPH_QUERY } from '@modules/knowledge/application/queries/knowledge.queries';
import {
  toReactFlowElements,
  type KnowledgeGraphNode,
  type RawGraphEdge,
  type RawGraphNode,
} from './graph-helpers';
import { KnowledgeNode } from './KnowledgeNode';
import { OrphanNode } from './OrphanNode';
import { GraphControls, MiniMapWrapper } from './GraphControls';
import Spinkit from '../../../../../components/Spinkit';

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

interface KnowledgeGraphProps {
  status?: string;
  onNodeClick?: (entry: { id?: string; title: string; isOrphan: boolean }) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ status, onNodeClick }) => {
  const { data, loading, error, refetch } = useQuery<KnowledgeGraphResponse>(KNOWLEDGE_GRAPH_QUERY, {
    variables: status ? { status } : {},
    fetchPolicy: 'cache-and-network',
  });

  const [showMinimap, setShowMinimap] = useState(false);

  const { nodes, edges } = useMemo<{ nodes: KnowledgeGraphNode[]; edges: Edge[] }>(() => {
    if (!data?.knowledgeGraph) return { nodes: [], edges: [] };
    return toReactFlowElements(data.knowledgeGraph.nodes, data.knowledgeGraph.edges);
  }, [data]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node: Node) => {
      onNodeClick?.({
        id: node.type === 'orphan' ? undefined : node.id,
        title: String((node.data as { label?: string })?.label ?? node.id),
        isOrphan: node.type === 'orphan',
      });
    },
    [onNodeClick],
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

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
        <p className="text-stone-500 dark:text-stone-400">
          No knowledge entries to visualize. Approve some drafts to populate the graph.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[640px] bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
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
        <GraphControls
          showMinimap={showMinimap}
          onToggleMinimap={() => setShowMinimap((value) => !value)}
        />
      </ReactFlowProvider>
    </div>
  );
};

export default KnowledgeGraph;
