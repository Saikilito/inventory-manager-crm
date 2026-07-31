import { describe, it, expect } from 'vitest';
import {
  toReactFlowElements,
  isDraggableHierarchyLevel,
  isDraftStatus,
  CATEGORY_COLORS,
  STATUS_BADGES,
  HIERARCHY_LEVEL_META,
  nodeMatchesFilters,
  hasActiveFilters,
  computeGraphStats,
  type RawGraphNode,
} from '../graph-helpers';

describe('toReactFlowElements', () => {
  it('should return empty arrays for empty input', () => {
    const result = toReactFlowElements([], []);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('should create a node for each known knowledge entry', () => {
    const result = toReactFlowElements(
      [
        { id: '1', title: 'Warranty', category: 'SALES', status: 'ACTIVE', hierarchyLevel: 'TOPIC' },
        { id: '2', title: 'Returns', category: 'SALES', status: 'ACTIVE', hierarchyLevel: 'TOPIC' },
      ],
      [],
    );
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0]?.id).toBe('1');
    expect(result.nodes[0]?.data.label).toBe('Warranty');
  });

  it('should resolve an edge when the target title matches a known node', () => {
    const result = toReactFlowElements(
      [
        { id: '1', title: 'Source', category: 'PRODUCTS', status: 'ACTIVE', hierarchyLevel: 'DATA' },
        { id: '2', title: 'Target', category: 'PRODUCTS', status: 'ACTIVE', hierarchyLevel: 'TOPIC' },
      ],
      [{ sourceId: '1', targetTitle: 'Target', targetId: '2', resolved: true }],
    );

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.source).toBe('1');
    expect(result.edges[0]?.target).toBe('2');
    expect(result.edges[0]?.style?.stroke).toBe('#10b981');
  });

  it('should create an orphan node for unresolved edges', () => {
    const result = toReactFlowElements(
      [{ id: '1', title: 'Source', category: 'SALES', status: 'ACTIVE', hierarchyLevel: 'DATA' }],
      [{ sourceId: '1', targetTitle: 'Ghost Reference', resolved: false }],
    );

    expect(result.nodes).toHaveLength(2);
    const orphan = result.nodes.find((n) => n.data.isOrphan);
    expect(orphan).toBeDefined();
    expect(orphan?.data.label).toBe('Ghost Reference');
    expect(result.edges[0]?.animated).toBe(true);
    expect(result.edges[0]?.style?.strokeDasharray).toBe('6 4');
  });

  it('should deduplicate orphan nodes when multiple edges point to the same missing target', () => {
    const result = toReactFlowElements(
      [
        { id: '1', title: 'A', category: 'SALES', status: 'ACTIVE', hierarchyLevel: 'DATA' },
        { id: '2', title: 'B', category: 'SALES', status: 'ACTIVE', hierarchyLevel: 'DATA' },
      ],
      [
        { sourceId: '1', targetTitle: 'Missing', resolved: false },
        { sourceId: '2', targetTitle: 'Missing', resolved: false },
      ],
    );

    const orphans = result.nodes.filter((n) => n.data.isOrphan);
    expect(orphans).toHaveLength(1);
  });

  it('should mark all nodes as draggable', () => {
    const result = toReactFlowElements(
      [
        { id: '1', title: 'Root', category: 'SALES', status: 'ACTIVE', hierarchyLevel: 'ROOT' },
        { id: '2', title: 'Doc', category: 'SALES', status: 'ACTIVE', hierarchyLevel: 'DATA' },
      ],
      [{ sourceId: '2', targetTitle: 'Ghost', resolved: false }],
    );

    expect(result.nodes.find((n) => n.id === '1')?.draggable).toBe(true);
    expect(result.nodes.find((n) => n.id === '2')?.draggable).toBe(true);
    expect(result.nodes.find((n) => n.data.isOrphan)?.draggable).toBe(true);
  });

  it('should apply a manually-dragged position override on top of the computed layout', () => {
    const result = toReactFlowElements(
      [{ id: '1', title: 'Doc', category: 'SALES', status: 'ACTIVE', hierarchyLevel: 'DATA' }],
      [],
      { '1': { x: 42, y: 99 } },
    );

    expect(result.nodes[0]?.position).toEqual({ x: 42, y: 99 });
  });

  it('should preserve an override for an orphan node keyed by its synthetic id', () => {
    const result = toReactFlowElements(
      [{ id: '1', title: 'Source', category: 'SALES', status: 'ACTIVE', hierarchyLevel: 'DATA' }],
      [{ sourceId: '1', targetTitle: 'Ghost', resolved: false }],
      { 'orphan::Ghost': { x: 7, y: 3 } },
    );

    const orphan = result.nodes.find((n) => n.data.isOrphan);
    expect(orphan?.position).toEqual({ x: 7, y: 3 });
  });
});

describe('isDraggableHierarchyLevel', () => {
  it('should be true for all hierarchy levels', () => {
    expect(isDraggableHierarchyLevel('DATA')).toBe(true);
    expect(isDraggableHierarchyLevel('ROOT')).toBe(true);
    expect(isDraggableHierarchyLevel('DOMAIN')).toBe(true);
    expect(isDraggableHierarchyLevel('TOPIC')).toBe(true);
  });
});

describe('isDraftStatus', () => {
  it('should be true only for DRAFT', () => {
    expect(isDraftStatus('DRAFT')).toBe(true);
    expect(isDraftStatus('ACTIVE')).toBe(false);
    expect(isDraftStatus('REJECTED')).toBe(false);
    expect(isDraftStatus(undefined)).toBe(false);
  });
});

describe('color helpers', () => {
  it('should expose a palette for every known category', () => {
    expect(CATEGORY_COLORS['SALES']).toBeDefined();
    expect(CATEGORY_COLORS['PRODUCTS']).toBeDefined();
    expect(CATEGORY_COLORS['COMPANY']).toBeDefined();
    expect(CATEGORY_COLORS['CUSTOMER_SERVICE']).toBeDefined();
    expect(CATEGORY_COLORS['__orphan__']).toBeDefined();
  });

  it('should expose a label and class for every known status', () => {
    expect(STATUS_BADGES.DRAFT).toBeDefined();
    expect(STATUS_BADGES.ACTIVE).toBeDefined();
    expect(STATUS_BADGES.REJECTED).toBeDefined();
  });

  it('should expose visual metadata for every hierarchy level', () => {
    expect(HIERARCHY_LEVEL_META.ROOT).toBeDefined();
    expect(HIERARCHY_LEVEL_META.DOMAIN).toBeDefined();
    expect(HIERARCHY_LEVEL_META.TOPIC).toBeDefined();
    expect(HIERARCHY_LEVEL_META.DATA).toBeDefined();
  });
});

describe('nodeMatchesFilters', () => {
  const node: RawGraphNode = {
    id: '1',
    title: 'Warranty Policy',
    category: 'SALES',
    status: 'ACTIVE',
    hierarchyLevel: 'TOPIC',
  };

  it('should match when no filters are set', () => {
    expect(nodeMatchesFilters(node, {})).toBe(true);
  });

  it('should match by case-insensitive substring search', () => {
    expect(nodeMatchesFilters(node, { searchText: 'warranty' })).toBe(true);
    expect(nodeMatchesFilters(node, { searchText: 'refund' })).toBe(false);
  });

  it('should match by category, status and hierarchyLevel', () => {
    expect(nodeMatchesFilters(node, { category: 'SALES' })).toBe(true);
    expect(nodeMatchesFilters(node, { category: 'PRODUCTS' })).toBe(false);
    expect(nodeMatchesFilters(node, { status: 'ACTIVE' })).toBe(true);
    expect(nodeMatchesFilters(node, { status: 'DRAFT' })).toBe(false);
    expect(nodeMatchesFilters(node, { hierarchyLevel: 'TOPIC' })).toBe(true);
    expect(nodeMatchesFilters(node, { hierarchyLevel: 'DATA' })).toBe(false);
  });

  it('should require every active filter to match', () => {
    expect(nodeMatchesFilters(node, { category: 'SALES', status: 'DRAFT' })).toBe(false);
  });
});

describe('hasActiveFilters', () => {
  it('should be false when every filter is empty', () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ searchText: '   ' })).toBe(false);
  });

  it('should be true when any filter is set', () => {
    expect(hasActiveFilters({ searchText: 'warranty' })).toBe(true);
    expect(hasActiveFilters({ category: 'SALES' })).toBe(true);
  });
});

describe('computeGraphStats', () => {
  it('should count indices, documents and unresolved links', () => {
    const nodes: RawGraphNode[] = [
      { id: '1', title: 'Root', category: 'SALES', status: 'ACTIVE', hierarchyLevel: 'ROOT' },
      { id: '2', title: 'Doc A', category: 'SALES', status: 'ACTIVE', hierarchyLevel: 'DATA' },
      { id: '3', title: 'Doc B', category: 'SALES', status: 'ACTIVE', hierarchyLevel: 'DATA' },
    ];
    const edges = [
      { sourceId: '2', targetTitle: 'Root', targetId: '1', resolved: true },
      { sourceId: '3', targetTitle: 'Ghost', resolved: false },
    ];

    const stats = computeGraphStats(nodes, edges);
    expect(stats).toEqual({
      totalNodes: 3,
      totalIndices: 1,
      totalDocuments: 2,
      unresolvedCount: 1,
    });
  });
});
