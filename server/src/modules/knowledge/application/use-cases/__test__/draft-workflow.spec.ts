import { describe, it, expect, vi } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { KnowledgeStatus } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { IKnowledge } from '../../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { NonEmptyStringVO } from '../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { KnowledgeCategory } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { HierarchyLevel } from '../../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { makeApproveKnowledge } from '../approve-knowledge.js';
import { makeRejectKnowledge } from '../reject-knowledge.js';
import { makeGetPendingKnowledge } from '../get-pending-knowledge.js';

const buildKnowledge = (overrides: Partial<IKnowledge> = {}): IKnowledge => ({
  id: '507f1f77bcf86cd799439011' as IKnowledge['id'],
  category: KnowledgeCategory.SALES as IKnowledge['category'],
  title: NonEmptyStringVO.create('Sample'),
  content: NonEmptyStringVO.create('Content'),
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildRepository = (overrides: Partial<{
  getById: ReturnType<typeof vi.fn>;
  updateStatus: ReturnType<typeof vi.fn>;
  findByStatus: ReturnType<typeof vi.fn>;
}> = {}): any => ({
  getById: overrides.getById ?? vi.fn(),
  updateStatus: overrides.updateStatus ?? vi.fn().mockResolvedValue(Result.ok(undefined)),
  findByStatus: overrides.findByStatus ?? vi.fn(),
});

describe('ApproveKnowledge', () => {
  it('should return ValidationError for missing id', async () => {
    const repo = buildRepository();
    const result = await makeApproveKnowledge(repo)({ id: '', updatedBy: 'u1' });
    expect(result.isFailure).toBe(true);
  });

  it('should return NotFoundError when the entry does not exist', async () => {
    const repo = buildRepository({ getById: vi.fn().mockResolvedValue(Result.ok(null)) });
    const result = await makeApproveKnowledge(repo)({ id: '507f1f77bcf86cd799439011', updatedBy: 'u1' });
    expect(result.isFailure).toBe(true);
  });

  it('should be idempotent when entry is already ACTIVE', async () => {
    const entry = buildKnowledge({ status: KnowledgeStatus.ACTIVE as IKnowledge['status'] });
    const repo = buildRepository({ getById: vi.fn().mockResolvedValue(Result.ok(entry)) });
    const result = await makeApproveKnowledge(repo)({ id: '507f1f77bcf86cd799439011', updatedBy: '507f1f77bcf86cd799439022' });
    expect(result.isFailure).toBe(false);
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('should reject approving a REJECTED entry', async () => {
    const entry = buildKnowledge({ status: KnowledgeStatus.REJECTED as IKnowledge['status'] });
    const repo = buildRepository({ getById: vi.fn().mockResolvedValue(Result.ok(entry)) });
    const result = await makeApproveKnowledge(repo)({ id: '507f1f77bcf86cd799439011', updatedBy: 'u1' });
    expect(result.isFailure).toBe(true);
  });

  it('should transition DRAFT to ACTIVE and return refreshed entry', async () => {
    const draft = buildKnowledge();
    const active = buildKnowledge({ status: KnowledgeStatus.ACTIVE as IKnowledge['status'] });
    const getById = vi
      .fn()
      .mockResolvedValueOnce(Result.ok(draft))
      .mockResolvedValueOnce(Result.ok(active));
    const updateStatus = vi.fn().mockResolvedValue(Result.ok(undefined));
    const repo = buildRepository({ getById, updateStatus });

    const result = await makeApproveKnowledge(repo)({ id: '507f1f77bcf86cd799439011', updatedBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' });

    expect(result.isFailure).toBe(false);
    expect(updateStatus).toHaveBeenCalledWith(
      expect.anything(),
      KnowledgeStatus.ACTIVE,
      expect.anything(),
    );
    expect(result.getValue().status).toBe(KnowledgeStatus.ACTIVE);
  });
});

describe('RejectKnowledge', () => {
  it('should be idempotent when entry is already REJECTED', async () => {
    const entry = buildKnowledge({ status: KnowledgeStatus.REJECTED as IKnowledge['status'] });
    const repo = buildRepository({ getById: vi.fn().mockResolvedValue(Result.ok(entry)) });
    const result = await makeRejectKnowledge(repo)({ id: '507f1f77bcf86cd799439011', updatedBy: '507f1f77bcf86cd799439022' });
    expect(result.isFailure).toBe(false);
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('should reject rejecting an ACTIVE entry', async () => {
    const entry = buildKnowledge({ status: KnowledgeStatus.ACTIVE as IKnowledge['status'] });
    const repo = buildRepository({ getById: vi.fn().mockResolvedValue(Result.ok(entry)) });
    const result = await makeRejectKnowledge(repo)({ id: '507f1f77bcf86cd799439011', updatedBy: 'u1' });
    expect(result.isFailure).toBe(true);
  });

  it('should transition DRAFT to REJECTED and return refreshed entry', async () => {
    const draft = buildKnowledge();
    const rejected = buildKnowledge({ status: KnowledgeStatus.REJECTED as IKnowledge['status'] });
    const getById = vi
      .fn()
      .mockResolvedValueOnce(Result.ok(draft))
      .mockResolvedValueOnce(Result.ok(rejected));
    const updateStatus = vi.fn().mockResolvedValue(Result.ok(undefined));
    const repo = buildRepository({ getById, updateStatus });

    const result = await makeRejectKnowledge(repo)({ id: '507f1f77bcf86cd799439011', updatedBy: 'a4d3e8f1-2b3c-4d5e-9f0a-1b2c3d4e5f6a' });

    expect(result.isFailure).toBe(false);
    expect(updateStatus).toHaveBeenCalledWith(
      expect.anything(),
      KnowledgeStatus.REJECTED,
      expect.anything(),
    );
    expect(result.getValue().status).toBe(KnowledgeStatus.REJECTED);
  });
});

describe('GetPendingKnowledge', () => {
  it('should query the repository for DRAFT entries', async () => {
    const entries = [buildKnowledge(), buildKnowledge({ id: 'kb-2' as IKnowledge['id'] })];
    const findByStatus = vi.fn().mockResolvedValue(entries);
    const repo = buildRepository({ findByStatus });

    const result = await makeGetPendingKnowledge(repo)(undefined);

    expect(result.isFailure).toBe(false);
    expect(findByStatus).toHaveBeenCalledWith(KnowledgeStatus.DRAFT);
    expect(result.getValue()).toEqual(entries);
  });

  it('should pass through when given a custom status', async () => {
    const findByStatus = vi.fn().mockResolvedValue([]);
    const repo = buildRepository({ findByStatus });

    const result = await makeGetPendingKnowledge(repo)({ status: KnowledgeStatus.ACTIVE });

    expect(result.isFailure).toBe(false);
    expect(findByStatus).toHaveBeenCalledWith(KnowledgeStatus.ACTIVE);
  });
});
