import { describe, it, expect } from 'vitest';
import { makeKnowledge, makeKnowledgeResult } from '../knowledge.entity.js';
import { KnowledgeCategory, KnowledgeCategoryVO, KNOWN_KNOWLEDGE_CATEGORIES } from '../value-objects/knowledge-category.vo.js';
import { HierarchyLevel, HierarchyLevelVO, KNOWN_HIERARCHY_LEVELS } from '../value-objects/hierarchy-level.vo.js';
import { WikiLinkVO, type IWikiLink } from '../value-objects/wiki-link.vo.js';

describe('knowledge-category.vo', () => {
  it('should expose all expected categories', () => {
    expect(KNOWN_KNOWLEDGE_CATEGORIES).toEqual([
      'SALES',
      'PRODUCTS',
      'COMPANY',
      'CUSTOMER_SERVICE',
    ]);
  });

  it('should create a valid category', () => {
    const result = KnowledgeCategoryVO.createResult('sales');
    expect(result.isFailure).toBe(false);
    expect(result.getValue().toString()).toBe('SALES');
  });

  it('should reject an invalid category', () => {
    const result = KnowledgeCategoryVO.createResult('MARKETING');
    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('Invalid knowledge category');
  });

  it('should reject non-string input', () => {
    const result = KnowledgeCategoryVO.createResult(123 as unknown as string);
    expect(result.isFailure).toBe(true);
  });

  it('should be immutable at runtime', () => {
    const snapshot = { ...KnowledgeCategory };
    expect(() => {
      (KnowledgeCategory as Record<string, string>).NEW = 'NEW';
    }).toThrow();
    expect(KnowledgeCategory).toEqual(snapshot);
  });
});

describe('hierarchy-level.vo', () => {
  it('should expose all expected levels', () => {
    expect(KNOWN_HIERARCHY_LEVELS).toEqual(['ROOT', 'DOMAIN', 'TOPIC', 'DATA']);
  });

  it('should create a valid level', () => {
    const result = HierarchyLevelVO.createResult('topic');
    expect(result.isFailure).toBe(false);
    expect(result.getValue().toString()).toBe('TOPIC');
  });

  it('should reject an invalid level', () => {
    const result = HierarchyLevelVO.createResult('SUBTOPIC');
    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('Invalid hierarchy level');
  });
});

describe('WikiLinkVO', () => {
  it('should extract a single wiki link from content', () => {
    const links = WikiLinkVO.extractFromContent('See [[Warranty Policy]] for details');
    expect(links).toHaveLength(1);
    expect(links[0]?.title.toString()).toBe('Warranty Policy');
  });

  it('should extract multiple unique wiki links', () => {
    const links = WikiLinkVO.extractFromContent('Check [[Product Catalog]] and [[Pricing Rules]]');
    expect(links).toHaveLength(2);
    expect(links.map((l) => l.title.toString()).sort()).toEqual([
      'Pricing Rules',
      'Product Catalog',
    ]);
  });

  it('should deduplicate repeated links', () => {
    const links = WikiLinkVO.extractFromContent(
      'See [[Warranty]] and later [[Warranty]] again',
    );
    expect(links).toHaveLength(1);
    expect(links[0]?.title.toString()).toBe('Warranty');
  });

  it('should support the title|displayed alias syntax', () => {
    const links = WikiLinkVO.extractFromContent('Link to [[actualTitle|Displayed]] here');
    expect(links).toHaveLength(1);
    expect(links[0]?.title.toString()).toBe('actualTitle');
  });

  it('should return an empty array for content with no wiki links', () => {
    const links = WikiLinkVO.extractFromContent('Just plain text without any links');
    expect(links).toEqual([]);
  });

  it('should create a wiki link with optional url', () => {
    const link = WikiLinkVO.create({ title: 'External', url: 'https://example.com' });
    expect(link.title.toString()).toBe('External');
    expect(link.url).toBe('https://example.com');
  });

  it('should create a wiki link without url', () => {
    const link = WikiLinkVO.create({ title: 'Internal' });
    expect(link.title.toString()).toBe('Internal');
    expect(link.url).toBeUndefined();
  });

  it('should reject a wiki link with an invalid url', () => {
    const result = WikiLinkVO.createResult({ title: 'Bad', url: 'not-a-url' });
    expect(result.isFailure).toBe(true);
  });
});

describe('makeKnowledge', () => {
  const baseProps = {
    category: 'SALES' as const,
    title: 'Warranty Policy',
    content: 'See [[Warranty Policy]] for the 2-year coverage.',
    hierarchyLevel: 'TOPIC' as const,
    tags: ['warranty', 'products'],
    createdBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a',
  };

  it('should create a valid knowledge entry with auto-extracted wiki links', () => {
    const knowledge = makeKnowledge(baseProps);
    expect(knowledge.category).toBe(KnowledgeCategory.SALES);
    expect(knowledge.title.toString()).toBe('Warranty Policy');
    expect(knowledge.content.toString()).toContain('Warranty Policy');
    expect(knowledge.wikiLinks).toHaveLength(1);
    expect(knowledge.metadata.tags).toEqual(['warranty', 'products']);
    expect(knowledge.isActive).toBe(true);
    expect(knowledge.metadata.createdBy).toBe(baseProps.createdBy);
  });

  it('should default isActive to true when not provided', () => {
    const knowledge = makeKnowledge(baseProps);
    expect(knowledge.isActive).toBe(true);
  });

  it('should respect explicit isActive = false', () => {
    const knowledge = makeKnowledge({ ...baseProps, isActive: false });
    expect(knowledge.isActive).toBe(false);
  });

  it('should preserve explicitly provided wiki links', () => {
    const explicitLink: IWikiLink = WikiLinkVO.create({ title: 'Manual' });
    const knowledge = makeKnowledge({ ...baseProps, wikiLinks: [explicitLink] });
    expect(knowledge.wikiLinks).toHaveLength(1);
    expect(knowledge.wikiLinks[0]?.title.toString()).toBe('Manual');
  });

  it('should throw on invalid category', () => {
    expect(() =>
      makeKnowledge({ ...baseProps, category: 'INVALID' }),
    ).toThrowError();
  });

  it('should throw on invalid hierarchy level', () => {
    expect(() =>
      makeKnowledge({ ...baseProps, hierarchyLevel: 'SUPER_TOPIC' }),
    ).toThrowError();
  });

  it('should throw on empty title', () => {
    expect(() =>
      makeKnowledge({ ...baseProps, title: '   ' }),
    ).toThrowError();
  });

  it('should clean tag whitespace and drop empty tags', () => {
    const knowledge = makeKnowledge({
      ...baseProps,
      tags: ['  sales  ', '', 'discount', '   '],
    });
    expect(knowledge.metadata.tags).toEqual(['sales', 'discount']);
  });

  it('should return Result.fail through makeKnowledgeResult for invalid input', () => {
    const result = makeKnowledgeResult({ ...baseProps, title: '' });
    expect(result.isFailure).toBe(true);
  });

  it('should return Result.ok for valid input', () => {
    const result = makeKnowledgeResult(baseProps);
    expect(result.isFailure).toBe(false);
    expect(result.getValue().title.toString()).toBe('Warranty Policy');
  });

  it('should accept an explicit hierarchy level DOMAIN', () => {
    const knowledge = makeKnowledge({ ...baseProps, hierarchyLevel: HierarchyLevel.DOMAIN });
    expect(knowledge.metadata.hierarchyLevel).toBe(HierarchyLevel.DOMAIN);
  });
});
