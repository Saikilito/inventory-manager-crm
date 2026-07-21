import { describe, it, expect, vi } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { KnowledgeStatus } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { makeKnowledge } from '../../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { KnowledgeCategory } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { HierarchyLevel } from '../../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import { isLibrarianEnabled, makeLibrarianService } from '../librarian.service.js';

const PRODUCT_ID = IdVO.create('507f1f77bcf86cd799439011');

const buildProductExtractor = () => ({
  extract: vi.fn().mockReturnValue({
    category: KnowledgeCategory.PRODUCTS,
    title: 'Premium Coffee',
    content: 'Auto-extracted content',
    wikiLinks: [],
    hierarchyLevel: HierarchyLevel.TOPIC,
    tags: ['auto-extracted'],
    status: KnowledgeStatus.DRAFT,
    productId: PRODUCT_ID,
  }),
});

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 10));
};

describe('LibrarianService', () => {
  it('should be a no-op when disabled', async () => {
    const create = vi.fn();
    const log = vi.fn();
    const librarian = makeLibrarianService({
      knowledgeRepository: { create } as never,
      productExtractor: buildProductExtractor() as never,
      enabled: false,
      log,
    });

    expect(librarian.enabled()).toBe(false);
    await librarian.extractFromProduct({
      productId: PRODUCT_ID,
      name: 'Premium Coffee',
    });

    expect(create).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('info', expect.stringContaining('Disabled'), expect.anything());
  });

  it('should fire-and-forget: caller does not wait for repository.create', async () => {
    const create = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                Result.ok(
                  makeKnowledge({
                    category: KnowledgeCategory.PRODUCTS,
                    title: 'Premium Coffee',
                    content: 'Auto-extracted content',
                    hierarchyLevel: HierarchyLevel.TOPIC,
                    createdBy: '507f1f77bcf86cd799439011',
                  }),
                ),
              ),
            50,
          ),
        ),
    );
    const librarian = makeLibrarianService({
      knowledgeRepository: { create } as never,
      productExtractor: buildProductExtractor() as never,
    });

    const start = Date.now();
    await librarian.extractFromProduct({ productId: PRODUCT_ID, name: 'Premium Coffee' });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(20);
    expect(create).toHaveBeenCalled();
  });

  it('should call knowledgeRepository.create with DRAFT status and productId metadata', async () => {
    const create = vi.fn().mockResolvedValue(Result.ok({ id: 'new-id' }));
    const productExtractor = buildProductExtractor();
    const librarian = makeLibrarianService({
      knowledgeRepository: { create } as never,
      productExtractor: productExtractor as never,
    });

    await librarian.extractFromProduct({ productId: PRODUCT_ID, name: 'Premium Coffee' });
    await flush();

    expect(create).toHaveBeenCalledTimes(1);
    const arg = create.mock.calls[0]?.[0];
    expect(arg).toBeDefined();
    expect(arg.status).toBe(KnowledgeStatus.DRAFT);
    expect(arg.metadata.productId.toString()).toBe(PRODUCT_ID.toString());
  });

  it('should log a warning when create fails', async () => {
    const create = vi.fn().mockResolvedValue(Result.fail(new Error('DB down')));
    const log = vi.fn();
    const librarian = makeLibrarianService({
      knowledgeRepository: { create } as never,
      productExtractor: buildProductExtractor() as never,
      log,
    });

    await librarian.extractFromProduct({ productId: PRODUCT_ID, name: 'Premium Coffee' });
    await flush();

    expect(log).toHaveBeenCalledWith('warn', expect.stringContaining('Failed to persist'), expect.anything());
  });
});

describe('isLibrarianEnabled', () => {
  it('should default to true for empty/undefined values', () => {
    expect(isLibrarianEnabled(undefined)).toBe(true);
    expect(isLibrarianEnabled('')).toBe(true);
  });

  it('should accept truthy values', () => {
    expect(isLibrarianEnabled('1')).toBe(true);
    expect(isLibrarianEnabled('true')).toBe(true);
    expect(isLibrarianEnabled('yes')).toBe(true);
    expect(isLibrarianEnabled('on')).toBe(true);
  });

  it('should reject falsy values', () => {
    expect(isLibrarianEnabled('0')).toBe(false);
    expect(isLibrarianEnabled('false')).toBe(false);
    expect(isLibrarianEnabled('no')).toBe(false);
    expect(isLibrarianEnabled('off')).toBe(false);
  });
});
