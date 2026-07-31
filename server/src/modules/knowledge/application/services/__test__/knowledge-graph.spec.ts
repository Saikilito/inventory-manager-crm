import { describe, it, expect } from 'vitest';
import { aggregateGraph } from '../../use-cases/get-knowledge-graph.js';
import { KnowledgeCategory } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { HierarchyLevel } from '../../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import { KnowledgeStatus } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { IKnowledge } from '../../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { NonEmptyStringVO } from '../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';

const buildKnowledge = (overrides: Partial<IKnowledge> = {}): IKnowledge => ({
  id: 'kb-x' as IKnowledge['id'],
  category: KnowledgeCategory.PRODUCTS as IKnowledge['category'],
  title: NonEmptyStringVO.create('Sample'),
  content: NonEmptyStringVO.create('Sample content'),
  wikiLinks: [],
  metadata: {
    hierarchyLevel: HierarchyLevel.TOPIC as IKnowledge['metadata']['hierarchyLevel'],
    tags: [],
    createdBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' as IKnowledge['metadata']['createdBy'],
  },
  status: KnowledgeStatus.ACTIVE as IKnowledge['status'],
  isActive: true,
  ...overrides,
});

describe('aggregateGraph', () => {
  it('should return empty nodes and edges when given no entries', () => {
    const result = aggregateGraph([]);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('should produce a node per knowledge entry', () => {
    const result = aggregateGraph([
      buildKnowledge({ id: 'a' as IKnowledge['id'], title: NonEmptyStringVO.create('Alpha') }),
      buildKnowledge({ id: 'b' as IKnowledge['id'], title: NonEmptyStringVO.create('Beta') }),
    ]);

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0]?.title).toBe('Alpha');
    expect(result.nodes[1]?.title).toBe('Beta');
  });

  it('should pass through hierarchyLevel, content and tags for every node', () => {
    const result = aggregateGraph([
      buildKnowledge({
        id: 'a' as IKnowledge['id'],
        title: NonEmptyStringVO.create('Root Index'),
        content: NonEmptyStringVO.create('Points to sub-topics'),
        metadata: {
          hierarchyLevel: HierarchyLevel.ROOT as IKnowledge['metadata']['hierarchyLevel'],
          tags: ['index', 'sales'],
          createdBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' as IKnowledge['metadata']['createdBy'],
        },
      }),
      buildKnowledge({
        id: 'b' as IKnowledge['id'],
        title: NonEmptyStringVO.create('Leaf Document'),
        content: NonEmptyStringVO.create('[[Root Index]] some details'),
      }),
    ]);

    const rootNode = result.nodes.find((n) => n.id === 'a');
    expect(rootNode?.hierarchyLevel).toBe(HierarchyLevel.ROOT);
    expect(rootNode?.content).toBe('Points to sub-topics');
    expect(rootNode?.tags).toEqual(['index', 'sales']);

    const leafNode = result.nodes.find((n) => n.id === 'b');
    expect(leafNode?.hierarchyLevel).toBe(HierarchyLevel.TOPIC);
  });

  it('should default tags to an empty array when metadata.tags is not set', () => {
    const result = aggregateGraph([
      buildKnowledge({
        id: 'a' as IKnowledge['id'],
        metadata: {
          hierarchyLevel: HierarchyLevel.DATA as IKnowledge['metadata']['hierarchyLevel'],
          tags: undefined as unknown as string[],
          createdBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' as IKnowledge['metadata']['createdBy'],
        },
      }),
    ]);

    expect(result.nodes[0]?.tags).toEqual([]);
  });

  it('should resolve edges when the wiki link target matches another entry title', () => {
    const result = aggregateGraph([
      buildKnowledge({
        id: 'src' as IKnowledge['id'],
        title: NonEmptyStringVO.create('Source'),
        wikiLinks: [{ title: NonEmptyStringVO.create('Target') }],
      }),
      buildKnowledge({
        id: 'tgt' as IKnowledge['id'],
        title: NonEmptyStringVO.create('Target'),
      }),
    ]);

    const resolved = result.edges.find((e) => e.targetTitle === 'Target');
    expect(resolved).toBeDefined();
    expect(resolved?.resolved).toBe(true);
    expect(resolved?.targetId).toBe('tgt');
  });

  it('should mark edges as unresolved (orphan) when the target does not exist', () => {
    const result = aggregateGraph([
      buildKnowledge({
        id: 'src' as IKnowledge['id'],
        title: NonEmptyStringVO.create('Source'),
        wikiLinks: [{ title: NonEmptyStringVO.create('Ghost') }],
      }),
    ]);

    const ghost = result.edges.find((e) => e.targetTitle === 'Ghost');
    expect(ghost).toBeDefined();
    expect(ghost?.resolved).toBe(false);
    expect(ghost?.targetId).toBeUndefined();
  });

  it('should resolve case-insensitively and ignore parenthesized text', () => {
    const result = aggregateGraph([
      buildKnowledge({
        id: 'src' as IKnowledge['id'],
        title: NonEmptyStringVO.create('Source'),
        wikiLinks: [{ title: NonEmptyStringVO.create('PRODUCT CATALOG (v2)') }],
      }),
      buildKnowledge({
        id: 'tgt' as IKnowledge['id'],
        title: NonEmptyStringVO.create('Product Catalog'),
      }),
    ]);

    const edge = result.edges.find((e) => e.targetTitle === 'PRODUCT CATALOG (v2)');
    expect(edge?.resolved).toBe(true);
    expect(edge?.targetId).toBe('tgt');
  });

  it('should deduplicate edges from the same source and target', () => {
    const result = aggregateGraph([
      buildKnowledge({
        id: 'src' as IKnowledge['id'],
        title: NonEmptyStringVO.create('Source'),
        wikiLinks: [
          { title: NonEmptyStringVO.create('Target') },
          { title: NonEmptyStringVO.create('Target') },
        ],
      }),
      buildKnowledge({
        id: 'tgt' as IKnowledge['id'],
        title: NonEmptyStringVO.create('Target'),
      }),
    ]);

    const edgesForTarget = result.edges.filter((e) => e.targetTitle === 'Target');
    expect(edgesForTarget).toHaveLength(1);
  });
});
