import { describe, it, expect } from 'vitest';
import {
  KnowledgeStatus,
  KnowledgeStatusVO,
  KNOWN_KNOWLEDGE_STATUSES,
} from '../knowledge-status.vo.js';

describe('knowledge-status.vo', () => {
  it('should expose DRAFT, ACTIVE, and REJECTED in a stable order', () => {
    expect(KNOWN_KNOWLEDGE_STATUSES).toEqual(['DRAFT', 'ACTIVE', 'REJECTED']);
  });

  it('should accept a known status value', () => {
    const result = KnowledgeStatusVO.createResult('DRAFT');
    expect(result.isFailure).toBe(false);
    expect(result.getValue().toString()).toBe('DRAFT');
  });

  it('should accept lowercase and uppercase variants', () => {
    expect(KnowledgeStatusVO.createResult('draft').getValue().toString()).toBe('DRAFT');
    expect(KnowledgeStatusVO.createResult('Active').getValue().toString()).toBe('ACTIVE');
  });

  it('should reject an unknown status value', () => {
    const result = KnowledgeStatusVO.createResult('ARCHIVED');
    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('Invalid knowledge status');
  });

  it('should reject a non-string input', () => {
    const result = KnowledgeStatusVO.createResult(42 as unknown as string);
    expect(result.isFailure).toBe(true);
  });

  it('should throw on invalid input through create()', () => {
    expect(() => KnowledgeStatusVO.create('ARCHIVED')).toThrow();
  });

  it('should be frozen at runtime', () => {
    const snapshot = { ...KnowledgeStatus };
    expect(() => {
      (KnowledgeStatus as Record<string, string>).APPROVED = 'APPROVED';
    }).toThrow();
    expect(KnowledgeStatus).toEqual(snapshot);
  });
});
