import { describe, it, expect } from 'vitest';
import {
  calculateRelevanceScore,
  extractKeywords,
  makeCognitiveRouter,
  KNOWLEDGE_RELEVANCE_WEIGHTS,
  DEFAULT_TOP_N,
  STOP_WORDS,
} from '../cognitive-router.js';
import { KnowledgeCategory } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { HierarchyLevel } from '../../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import { KnowledgeStatus } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { IKnowledge } from '../../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { NonEmptyStringVO } from '../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';

const createMockKnowledge = (overrides: Partial<IKnowledge> = {}): IKnowledge => ({
  id: 'kb-1' as IKnowledge['id'],
  category: KnowledgeCategory.SALES as IKnowledge['category'],
  title: NonEmptyStringVO.create('Sample Title'),
  content: NonEmptyStringVO.create('Sample content here.'),
  wikiLinks: [],
  metadata: {
    hierarchyLevel: HierarchyLevel.TOPIC as IKnowledge['metadata']['hierarchyLevel'],
    tags: [],
    createdBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' as IKnowledge['metadata']['createdBy'],
  },
  status: KnowledgeStatus.ACTIVE as IKnowledge['status'],
  isActive: true,
  createdAt: undefined,
  updatedAt: undefined,
  ...overrides,
});

describe('extractKeywords', () => {
  it('should lowercase and tokenize input', () => {
    const result = extractKeywords('Product WARRANTY Policy');
    expect(result).toContain('product');
    expect(result).toContain('warranty');
    expect(result).toContain('policy');
  });

  it('should remove stop words', () => {
    const result = extractKeywords('what is the warranty');
    expect(result).toEqual(['warranty']);
  });

  it('should drop single-character tokens', () => {
    const result = extractKeywords('a warranty');
    expect(result).toEqual(['warranty']);
  });

  it('should handle Spanish stop words', () => {
    const result = extractKeywords('la garantía del producto');
    expect(result).toEqual(['garantía', 'producto']);
  });

  it('should return unique tokens only', () => {
    const result = extractKeywords('warranty warranty warranty');
    expect(result).toEqual(['warranty']);
  });

  it('should return empty array for empty or non-string input', () => {
    expect(extractKeywords('')).toEqual([]);
    expect(extractKeywords(null as unknown as string)).toEqual([]);
  });

  it('should not mutate STOP_WORDS set', () => {
    const sizeBefore = STOP_WORDS.size;
    extractKeywords('hello world');
    expect(STOP_WORDS.size).toBe(sizeBefore);
  });
});

describe('calculateRelevanceScore', () => {
  const now = new Date('2026-07-20T12:00:00Z');

  it('should give +0.4 for a title match', () => {
    const knowledge = createMockKnowledge({
      title: NonEmptyStringVO.create('Warranty Policy'),
      content: NonEmptyStringVO.create('No relevant terms here.'),
    });

    const score = calculateRelevanceScore(
      knowledge,
      ['warranty'],
      undefined,
      now,
    );

    expect(score).toBeCloseTo(KNOWLEDGE_RELEVANCE_WEIGHTS.TITLE_MATCH, 5);
  });

  it('should give +0.1 per content keyword match (capped at +0.3)', () => {
    const knowledge = createMockKnowledge({
      title: NonEmptyStringVO.create('Generic'),
      content: NonEmptyStringVO.create('product product product product'),
    });

    const score = calculateRelevanceScore(
      knowledge,
      ['product'],
      undefined,
      now,
    );

    expect(score).toBeCloseTo(0.1, 5);
  });

  it('should cap content density bonus at +0.3 even with many matches', () => {
    const knowledge = createMockKnowledge({
      title: NonEmptyStringVO.create('Generic'),
      content: NonEmptyStringVO.create('warranty coverage policy protection'),
    });

    const score = calculateRelevanceScore(
      knowledge,
      ['warranty', 'coverage', 'policy', 'protection'],
      undefined,
      now,
    );

    expect(score).toBeCloseTo(KNOWLEDGE_RELEVANCE_WEIGHTS.CONTENT_DENSITY_MAX, 5);
  });

  it('should add +0.2 for category bonus when filter matches', () => {
    const knowledge = createMockKnowledge({
      category: KnowledgeCategory.SALES as IKnowledge['category'],
      title: NonEmptyStringVO.create('Other'),
    });

    const score = calculateRelevanceScore(
      knowledge,
      ['sales'],
      KnowledgeCategory.SALES as IKnowledge['category'],
      now,
    );

    expect(score).toBeCloseTo(KNOWLEDGE_RELEVANCE_WEIGHTS.CATEGORY_BONUS, 5);
  });

  it('should NOT add category bonus when filter does not match', () => {
    const knowledge = createMockKnowledge({
      category: KnowledgeCategory.SALES as IKnowledge['category'],
    });

    const score = calculateRelevanceScore(
      knowledge,
      ['pricing'],
      KnowledgeCategory.PRODUCTS as IKnowledge['category'],
      now,
    );

    expect(score).toBe(0);
  });

  it('should add +0.1 recency bonus when updated within 30 days', () => {
    const tenDaysAgo = new Date(now.getTime() - 10 * 86_400_000).toISOString();
    const knowledge = createMockKnowledge({
      title: NonEmptyStringVO.create('Pricing'),
      updatedAt: tenDaysAgo as IKnowledge['updatedAt'],
    });

    const score = calculateRelevanceScore(
      knowledge,
      ['pricing'],
      undefined,
      now,
    );

    expect(score).toBeCloseTo(
      KNOWLEDGE_RELEVANCE_WEIGHTS.TITLE_MATCH + KNOWLEDGE_RELEVANCE_WEIGHTS.RECENCY_BONUS,
      5,
    );
  });

  it('should NOT add recency bonus when updated more than 30 days ago', () => {
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000).toISOString();
    const knowledge = createMockKnowledge({
      title: NonEmptyStringVO.create('Pricing'),
      updatedAt: ninetyDaysAgo as IKnowledge['updatedAt'],
    });

    const score = calculateRelevanceScore(
      knowledge,
      ['pricing'],
      undefined,
      now,
    );

    expect(score).toBeCloseTo(KNOWLEDGE_RELEVANCE_WEIGHTS.TITLE_MATCH, 5);
  });

  it('should cap the final score at 1.0', () => {
    const recent = new Date(now.getTime() - 5 * 86_400_000).toISOString();
    const knowledge = createMockKnowledge({
      title: NonEmptyStringVO.create('Warranty'),
      content: NonEmptyStringVO.create('warranty coverage policy protection'),
      category: KnowledgeCategory.SALES as IKnowledge['category'],
      metadata: {
        hierarchyLevel: HierarchyLevel.TOPIC as IKnowledge['metadata']['hierarchyLevel'],
        tags: ['warranty', 'coverage'],
        createdBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' as IKnowledge['metadata']['createdBy'],
      },
      updatedAt: recent as IKnowledge['updatedAt'],
    });

    const score = calculateRelevanceScore(
      knowledge,
      ['warranty', 'coverage', 'policy', 'protection'],
      KnowledgeCategory.SALES as IKnowledge['category'],
      now,
    );

    expect(score).toBeLessThanOrEqual(1.0);
    expect(score).toBeCloseTo(1.0, 10);
  });

  it('should return 0 when keywords array is empty', () => {
    const knowledge = createMockKnowledge();
    const score = calculateRelevanceScore(knowledge, [], undefined, now);
    expect(score).toBe(0);
  });

  it('should match against tags as well', () => {
    const knowledge = createMockKnowledge({
      title: NonEmptyStringVO.create('Generic'),
      content: NonEmptyStringVO.create('Generic body text'),
      metadata: {
        hierarchyLevel: HierarchyLevel.TOPIC as IKnowledge['metadata']['hierarchyLevel'],
        tags: ['saldos', 'inventario'],
        createdBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' as IKnowledge['metadata']['createdBy'],
      },
    });

    const score = calculateRelevanceScore(knowledge, ['inventario'], undefined, now);
    expect(score).toBeGreaterThan(0);
  });
});

describe('makeCognitiveRouter', () => {
const buildFixture = (overrides: Partial<IKnowledge> = {}): IKnowledge => ({
  id: 'kb-1' as IKnowledge['id'],
  category: KnowledgeCategory.PRODUCTS as IKnowledge['category'],
  title: NonEmptyStringVO.create('Product Warranty'),
  content: NonEmptyStringVO.create('2 year warranty'),
  wikiLinks: [],
  metadata: {
    hierarchyLevel: HierarchyLevel.TOPIC as IKnowledge['metadata']['hierarchyLevel'],
    tags: [],
    createdBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' as IKnowledge['metadata']['createdBy'],
  },
  status: KnowledgeStatus.ACTIVE as IKnowledge['status'],
  isActive: true,
  updatedAt: new Date().toISOString() as IKnowledge['updatedAt'],
  ...overrides,
});

  it('should return empty array when query has no extractable keywords', async () => {
    const router = makeCognitiveRouter({ textSearch: async () => [] });
    const result = await router({ query: 'a is' });
    expect(result).toEqual([]);
  });

  it('should score and sort results by relevance descending', async () => {
    const weakMatch = buildFixture({
      id: 'kb-1' as IKnowledge['id'],
      title: NonEmptyStringVO.create('Other'),
      content: NonEmptyStringVO.create('Some other info'),
    });
    const strongMatch = buildFixture({
      id: 'kb-2' as IKnowledge['id'],
      title: NonEmptyStringVO.create('Warranty Policy'),
    });

    const router = makeCognitiveRouter({
      textSearch: async () => [weakMatch, strongMatch],
    });

    const result = await router({ query: 'warranty' });
    expect(result).toHaveLength(2);
    expect(result[0]?.knowledge.id).toBe('kb-2');
    expect(result[0]?.score).toBeGreaterThan(result[1]?.score ?? 0);
  });

  it('should respect topN limit', async () => {
    const matches = Array.from({ length: 10 }, (_, i) =>
      buildFixture({ id: `kb-${i}` as IKnowledge['id'] }),
    );

    const router = makeCognitiveRouter({
      textSearch: async () => matches,
    });

    const result = await router({ query: 'product', topN: 3 });
    expect(result).toHaveLength(3);
  });

  it('should fall back to default topN when not provided', async () => {
    const matches = Array.from({ length: DEFAULT_TOP_N + 5 }, (_, i) =>
      buildFixture({ id: `kb-${i}` as IKnowledge['id'] }),
    );

    const router = makeCognitiveRouter({
      textSearch: async () => matches,
    });

    const result = await router({ query: 'product' });
    expect(result).toHaveLength(DEFAULT_TOP_N);
  });

  it('should return empty array when no matches found', async () => {
    const router = makeCognitiveRouter({
      textSearch: async () => [],
    });
    const result = await router({ query: 'warranty' });
    expect(result).toEqual([]);
  });

  it('should filter out inactive knowledge entries', async () => {
    const active = buildFixture({ id: 'kb-1' as IKnowledge['id'] });
    const inactive = buildFixture({ id: 'kb-2' as IKnowledge['id'], isActive: false });

    const router = makeCognitiveRouter({
      textSearch: async () => [active, inactive],
    });

    const result = await router({ query: 'warranty' });
    expect(result).toHaveLength(1);
    expect(result[0]?.knowledge.id).toBe('kb-1');
  });

  it('should filter out DRAFT and REJECTED knowledge entries', async () => {
    const active = buildFixture({ id: 'kb-1' as IKnowledge['id'] });
    const draft = buildFixture({
      id: 'kb-2' as IKnowledge['id'],
      status: KnowledgeStatus.DRAFT as IKnowledge['status'],
    });
    const rejected = buildFixture({
      id: 'kb-3' as IKnowledge['id'],
      status: KnowledgeStatus.REJECTED as IKnowledge['status'],
    });

    const router = makeCognitiveRouter({
      textSearch: async () => [active, draft, rejected],
    });

    const result = await router({ query: 'warranty' });
    expect(result).toHaveLength(1);
    expect(result[0]?.knowledge.id).toBe('kb-1');
  });

  it('should call textSearch with the joined keywords', async () => {
    let capturedQuery: string | undefined;
    const router = makeCognitiveRouter({
      textSearch: async (query) => {
        capturedQuery = query;
        return [];
      },
    });

    await router({ query: 'product warranty policy' });
    expect(capturedQuery).toBe('product warranty policy');
  });

  it('should pass category to textSearch when provided', async () => {
    let capturedCategory: unknown;
    const router = makeCognitiveRouter({
      textSearch: async (_query, category) => {
        capturedCategory = category;
        return [];
      },
    });

    await router({
      query: 'warranty',
      category: KnowledgeCategory.SALES as IKnowledge['category'],
    });

    expect(capturedCategory).toBe(KnowledgeCategory.SALES);
  });
});
