import { describe, it, expect, vi } from 'vitest';
import { KnowledgeStatus } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { KnowledgeCategory } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { HierarchyLevel } from '../../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import { NonEmptyStringVO } from '../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IKnowledge } from '../../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { makeGetKnowledgeGraph } from '../get-knowledge-graph.js';

const buildKnowledge = (overrides: Partial<IKnowledge> = {}): IKnowledge => ({
  id: 'kb-x' as IKnowledge['id'],
  category: KnowledgeCategory.PRODUCTS as IKnowledge['category'],
  title: NonEmptyStringVO.create('Sample'),
  content: NonEmptyStringVO.create('Sample content'),
  wikiLinks: [],
  metadata: {
    hierarchyLevel: HierarchyLevel.TOPIC as IKnowledge['metadata']['hierarchyLevel'],
    tags: [],
    createdBy: IdVO.create('a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a'),
  },
  status: KnowledgeStatus.ACTIVE as IKnowledge['status'],
  isActive: true,
  ...overrides,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildRepository = (overrides: Partial<{ findByStatus: ReturnType<typeof vi.fn> }> = {}): any => ({
  findByStatus: overrides.findByStatus ?? vi.fn().mockResolvedValue([]),
});

describe('makeGetKnowledgeGraph', () => {
  it('should default to ACTIVE-only entries when no input is given', async () => {
    const findByStatus = vi.fn().mockResolvedValue([]);
    const repo = buildRepository({ findByStatus });

    await makeGetKnowledgeGraph(repo)(undefined);

    expect(findByStatus).toHaveBeenCalledTimes(1);
    expect(findByStatus).toHaveBeenCalledWith(KnowledgeStatus.ACTIVE);
  });

  it('should keep querying a single explicit status when includeDrafts is not set', async () => {
    const findByStatus = vi.fn().mockResolvedValue([]);
    const repo = buildRepository({ findByStatus });

    await makeGetKnowledgeGraph(repo)({ status: KnowledgeStatus.DRAFT });

    expect(findByStatus).toHaveBeenCalledTimes(1);
    expect(findByStatus).toHaveBeenCalledWith(KnowledgeStatus.DRAFT);
  });

  it('should query both ACTIVE and DRAFT and merge them when includeDrafts is true', async () => {
    const activeEntry = buildKnowledge({
      id: 'active-1' as IKnowledge['id'],
      status: KnowledgeStatus.ACTIVE as IKnowledge['status'],
    });
    const draftEntry = buildKnowledge({
      id: 'draft-1' as IKnowledge['id'],
      status: KnowledgeStatus.DRAFT as IKnowledge['status'],
    });
    const findByStatus = vi
      .fn()
      .mockImplementation((status: string) =>
        Promise.resolve(status === KnowledgeStatus.ACTIVE ? [activeEntry] : [draftEntry]),
      );
    const repo = buildRepository({ findByStatus });

    const result = await makeGetKnowledgeGraph(repo)({ includeDrafts: true });

    expect(findByStatus).toHaveBeenCalledTimes(2);
    expect(findByStatus).toHaveBeenCalledWith(KnowledgeStatus.ACTIVE);
    expect(findByStatus).toHaveBeenCalledWith(KnowledgeStatus.DRAFT);
    expect(result.isFailure).toBe(false);
    expect(result.getValue().nodes.map((n) => n.id)).toEqual(
      expect.arrayContaining(['active-1', 'draft-1']),
    );
  });

  it('should resolve a DRAFT document linking to an ACTIVE index as a resolved edge, not an orphan', async () => {
    const activeIndex = buildKnowledge({
      id: 'index-1' as IKnowledge['id'],
      title: NonEmptyStringVO.create('Warranty Index'),
      status: KnowledgeStatus.ACTIVE as IKnowledge['status'],
    });
    const draftDoc = buildKnowledge({
      id: 'doc-1' as IKnowledge['id'],
      title: NonEmptyStringVO.create('Warranty Details'),
      status: KnowledgeStatus.DRAFT as IKnowledge['status'],
      wikiLinks: [{ title: NonEmptyStringVO.create('Warranty Index') }],
    });
    const findByStatus = vi
      .fn()
      .mockImplementation((status: string) =>
        Promise.resolve(status === KnowledgeStatus.ACTIVE ? [activeIndex] : [draftDoc]),
      );
    const repo = buildRepository({ findByStatus });

    const result = await makeGetKnowledgeGraph(repo)({ includeDrafts: true });

    const edge = result.getValue().edges.find((e) => e.sourceId === 'doc-1');
    expect(edge?.resolved).toBe(true);
    expect(edge?.targetId).toBe('index-1');
  });
});
