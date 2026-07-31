import { describe, it, expect, vi } from 'vitest';
import {
  makeKnowledgeInjector,
  KNOWLEDGE_INJECTOR_DEFAULTS,
  KNOWLEDGE_CONTEXT_EMPTY,
  KNOWLEDGE_CONTEXT_HEADER,
  KNOWLEDGE_CONTEXT_FOOTER,
} from '../knowledge-injector.js';
import { KnowledgeCategory } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { HierarchyLevel } from '../../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import { KnowledgeStatus } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { IKnowledge } from '../../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { NonEmptyStringVO } from '../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';

const buildKnowledge = (overrides: Partial<IKnowledge> = {}): IKnowledge => ({
  id: 'kb-1' as IKnowledge['id'],
  category: KnowledgeCategory.SALES as IKnowledge['category'],
  title: NonEmptyStringVO.create('Warranty'),
  content: NonEmptyStringVO.create('All products include 2-year warranty.'),
  wikiLinks: [],
  metadata: {
    hierarchyLevel: HierarchyLevel.TOPIC as IKnowledge['metadata']['hierarchyLevel'],
    tags: ['warranty'],
    createdBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' as IKnowledge['metadata']['createdBy'],
  },
  status: KnowledgeStatus.ACTIVE as IKnowledge['status'],
  isActive: true,
  updatedAt: new Date().toISOString() as IKnowledge['updatedAt'],
  ...overrides,
});

describe('makeKnowledgeInjector', () => {
  it('should return the empty marker when no knowledge matches', async () => {
    const router = vi.fn().mockResolvedValue([]);
    const injector = makeKnowledgeInjector({ cognitiveRouter: router });

    const result = await injector({ query: 'warranty' });

    expect(result.block).toBe(KNOWLEDGE_CONTEXT_EMPTY);
    expect(result.includedTitles).toEqual([]);
  });

  it('should format a context block with header, entries, and footer', async () => {
    const router = vi.fn().mockResolvedValue([
      { knowledge: buildKnowledge(), score: 0.85 },
      { knowledge: buildKnowledge({ id: 'kb-2' as IKnowledge['id'], title: NonEmptyStringVO.create('Returns') }), score: 0.65 },
    ]);
    const injector = makeKnowledgeInjector({ cognitiveRouter: router });

    const result = await injector({ query: 'warranty' });

    expect(result.block).toContain(KNOWLEDGE_CONTEXT_HEADER);
    expect(result.block).toContain(KNOWLEDGE_CONTEXT_FOOTER);
    expect(result.block).toContain('[SALES] Warranty');
    expect(result.block).toContain('[SALES] Returns');
    expect(result.block).toContain('relevancia: 85%');
    expect(result.block).toContain('relevancia: 65%');
    expect(result.includedTitles).toEqual(['Warranty', 'Returns']);
  });

  it('should pass topN through to the cognitive router', async () => {
    const router = vi.fn().mockResolvedValue([]);
    const injector = makeKnowledgeInjector({ cognitiveRouter: router });

    await injector({ query: 'warranty', topN: 7 });

    expect(router).toHaveBeenCalledWith(
      expect.objectContaining({ topN: 7 }),
    );
  });

  it('should use the configured topN (3 by default)', async () => {
    const router = vi.fn().mockResolvedValue([]);
    const injector = makeKnowledgeInjector({ cognitiveRouter: router });

    await injector({ query: 'warranty' });

    const callArgs = router.mock.calls[0]?.[0] as { topN: number };
    expect(callArgs.topN).toBe(3);
  });

  it('should pass category through to the cognitive router', async () => {
    const router = vi.fn().mockResolvedValue([]);
    const injector = makeKnowledgeInjector({ cognitiveRouter: router });

    await injector({
      query: 'warranty',
      category: KnowledgeCategory.PRODUCTS as IKnowledge['category'],
    });

    expect(router).toHaveBeenCalledWith(
      expect.objectContaining({ category: KnowledgeCategory.PRODUCTS }),
    );
  });

  it('should respect the default topN constant', () => {
    expect(KNOWLEDGE_INJECTOR_DEFAULTS.TOP_N).toBe(3);
  });

  it('should truncate long content to fit the token budget', async () => {
    const longContent = 'Lorem ipsum '.repeat(500);
    const router = vi.fn().mockResolvedValue([
      { knowledge: buildKnowledge({ content: NonEmptyStringVO.create(longContent) }), score: 0.9 },
    ]);
    const injector = makeKnowledgeInjector({ cognitiveRouter: router });

    const result = await injector({
      query: 'warranty',
      tokenBudget: 100,
    });

    expect(result.block.length).toBeLessThan(longContent.length + 200);
    expect(result.block).toContain('...');
  });
});
