import { describe, it, expect, vi } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { NonEmptyStringVO } from '../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { KnowledgeCategory } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { HierarchyLevel } from '../../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import { KnowledgeStatus } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IKnowledge } from '../../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { makeDeleteKnowledge } from '../delete-knowledge.js';

const buildKnowledge = (): IKnowledge => ({
  id: '507f1f77bcf86cd799439011' as IKnowledge['id'],
  category: KnowledgeCategory.SALES as IKnowledge['category'],
  title: NonEmptyStringVO.create('Sample Entry'),
  content: NonEmptyStringVO.create('Sample Content'),
  wikiLinks: [],
  metadata: {
    hierarchyLevel: HierarchyLevel.DATA as IKnowledge['metadata']['hierarchyLevel'],
    tags: [],
    createdBy: IdVO.create('a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a'),
  },
  status: KnowledgeStatus.ACTIVE as IKnowledge['status'],
  isActive: true,
});

describe('DeleteKnowledge Use Case', () => {
  it('should return error if id or deletedBy are invalid', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repo = {} as any;
    const deleteKnowledge = makeDeleteKnowledge(repo);

    const result = await deleteKnowledge({ id: '', deletedBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' });
    expect(result.isFailure).toBe(true);
  });

  it('should return NotFoundError if document does not exist', async () => {
    const getById = vi.fn().mockResolvedValue(Result.ok(null));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repo = { getById } as any;
    const deleteKnowledge = makeDeleteKnowledge(repo);

    const result = await deleteKnowledge({ id: '507f1f77bcf86cd799439011', deletedBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' });
    expect(result.isFailure).toBe(true);
  });

  it('should call deleteByIds and permanently remove the document', async () => {
    const existing = buildKnowledge();
    const getById = vi.fn().mockResolvedValue(Result.ok(existing));
    const deleteByIds = vi.fn().mockResolvedValue(Result.ok(undefined));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repo = { getById, deleteByIds } as any;
    const deleteKnowledge = makeDeleteKnowledge(repo);

    const result = await deleteKnowledge({ id: '507f1f77bcf86cd799439011', deletedBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' });

    expect(result.isFailure).toBe(false);
    expect(deleteByIds).toHaveBeenCalledWith(
      [expect.anything()],
      expect.anything(),
    );
  });
});
