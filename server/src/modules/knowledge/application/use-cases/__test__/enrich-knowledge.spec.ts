import { describe, it, expect, vi } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { KnowledgeStatus } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { KnowledgeCategory } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { HierarchyLevel } from '../../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import { IKnowledge } from '../../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { NonEmptyStringVO } from '../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { makeEnrichKnowledge } from '../enrich-knowledge.js';
import { IWebEnricher } from '../../services/web-enricher.js';

const buildKnowledge = (overrides: Partial<IKnowledge> = {}): IKnowledge => ({
  id: '507f1f77bcf86cd799439011' as IKnowledge['id'],
  category: KnowledgeCategory.PRODUCTS as IKnowledge['category'],
  title: NonEmptyStringVO.create('Sample'),
  content: NonEmptyStringVO.create('Original content.'),
  wikiLinks: [],
  metadata: {
    hierarchyLevel: HierarchyLevel.TOPIC as IKnowledge['metadata']['hierarchyLevel'],
    tags: [],
    createdBy: IdVO.create('a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a'),
  },
  status: KnowledgeStatus.DRAFT as IKnowledge['status'],
  isActive: true,
  ...overrides,
});

describe('EnrichKnowledge', () => {
  it('should return the existing entry when there are no URL-bearing wiki links', async () => {
    const entry = buildKnowledge();
    const getById = vi.fn().mockResolvedValue(Result.ok(entry));
    const updateById = vi.fn();
    const webEnricher: IWebEnricher = { fetch: vi.fn() };

    const result = await makeEnrichKnowledge({
      knowledgeRepository: { getById, updateById } as never,
      webEnricher,
    })({
      id: entry.id!.toString(),
      updatedBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a',
    });

    expect(result.isFailure).toBe(false);
    expect(webEnricher.fetch).not.toHaveBeenCalled();
    expect(updateById).not.toHaveBeenCalled();
  });

  it('should fetch URL-bearing links, append summaries, and update content', async () => {
    const entry = buildKnowledge({
      wikiLinks: [
        { title: NonEmptyStringVO.create('Reference Doc'), url: 'https://example.com/docs' },
      ],
    });
    const getById = vi
      .fn()
      .mockResolvedValueOnce(Result.ok(entry))
      .mockResolvedValueOnce(
        Result.ok(
          buildKnowledge({
            content: NonEmptyStringVO.create(
              'Original content.\n\n## Auto-enriched references\n\n[[Reference Doc]] (auto-enriched): Extracted summary text.',
            ),
          }),
        ),
      );
    const updateById = vi.fn().mockResolvedValue(Result.ok(undefined));
    const webEnricher: IWebEnricher = {
      fetch: vi.fn().mockResolvedValue('<html><body><p>Extracted summary text.</p></body></html>'),
    };

    const result = await makeEnrichKnowledge({
      knowledgeRepository: { getById, updateById } as never,
      webEnricher,
    })({
      id: entry.id!.toString(),
      updatedBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a',
    });

    expect(result.isFailure).toBe(false);
    expect(webEnricher.fetch).toHaveBeenCalledWith('https://example.com/docs');
    expect(updateById).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = updateById.mock.calls[0]?.[1] as { content: any };
    expect(updated.content.toString()).toContain('Auto-enriched references');
  });

  it('should return existing entry when all web fetches fail', async () => {
    const entry = buildKnowledge({
      wikiLinks: [
        { title: NonEmptyStringVO.create('Broken Link'), url: 'https://example.com/down' },
      ],
    });
    const getById = vi.fn().mockResolvedValue(Result.ok(entry));
    const updateById = vi.fn();
    const webEnricher: IWebEnricher = {
      fetch: vi.fn().mockRejectedValue(new Error('Network error')),
    };

    const result = await makeEnrichKnowledge({
      knowledgeRepository: { getById, updateById } as never,
      webEnricher,
    })({
      id: entry.id!.toString(),
      updatedBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a',
    });

    expect(result.isFailure).toBe(false);
    expect(result.getValue().content.toString()).toBe(entry.content.toString());
    expect(updateById).not.toHaveBeenCalled();
  });
});
