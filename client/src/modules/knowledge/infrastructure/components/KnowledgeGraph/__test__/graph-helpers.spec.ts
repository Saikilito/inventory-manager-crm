import { describe, it, expect } from 'vitest';
import { toReactFlowElements, CATEGORY_COLORS, STATUS_BADGES } from '../graph-helpers';

describe('toReactFlowElements', () => {
  it('should return empty arrays for empty input', () => {
    const result = toReactFlowElements([], []);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('should create a node for each known knowledge entry', () => {
    const result = toReactFlowElements(
      [
        { id: '1', title: 'Warranty', category: 'SALES', status: 'ACTIVE' },
        { id: '2', title: 'Returns', category: 'SALES', status: 'ACTIVE' },
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
        { id: '1', title: 'Source', category: 'PRODUCTS', status: 'ACTIVE' },
        { id: '2', title: 'Target', category: 'PRODUCTS', status: 'ACTIVE' },
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
      [{ id: '1', title: 'Source', category: 'SALES', status: 'ACTIVE' }],
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
        { id: '1', title: 'A', category: 'SALES', status: 'ACTIVE' },
        { id: '2', title: 'B', category: 'SALES', status: 'ACTIVE' },
      ],
      [
        { sourceId: '1', targetTitle: 'Missing', resolved: false },
        { sourceId: '2', targetTitle: 'Missing', resolved: false },
      ],
    );

    const orphans = result.nodes.filter((n) => n.data.isOrphan);
    expect(orphans).toHaveLength(1);
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
});
