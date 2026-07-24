import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { createValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import {
  KnowledgeStatus,
  KnowledgeStatusType,
  KnowledgeStatusVO,
} from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';

export const getPendingKnowledgeInputSchema = z
  .object({
    status: z.enum([KnowledgeStatus.DRAFT, KnowledgeStatus.ACTIVE, KnowledgeStatus.REJECTED]).optional(),
  })
  .optional();

export type GetPendingKnowledgeInput = z.infer<typeof getPendingKnowledgeInputSchema>;

export type GetPendingKnowledge = UseCase<GetPendingKnowledgeInput | undefined, IKnowledge[], DomainError>;

export const makeGetPendingKnowledge = (knowledgeRepository: IKnowledgeRepository): GetPendingKnowledge => {
  return async (input) => {
    if (input !== undefined) {
      const parsed = getPendingKnowledgeInputSchema.safeParse(input);
      if (!parsed.success) {
        return Result.fail(createValidationError(parsed.error.issues.map((i) => i.message).join(', ')));
      }

      const requestedStatus: KnowledgeStatusType = parsed.data?.status
        ? KnowledgeStatusVO.create(parsed.data.status)
        : KnowledgeStatusVO.create(KnowledgeStatus.DRAFT);

      const entries = await knowledgeRepository.findByStatus(requestedStatus);
      return Result.ok(entries);
    }

    const defaultStatus = KnowledgeStatusVO.create(KnowledgeStatus.DRAFT);
    const entries = await knowledgeRepository.findByStatus(defaultStatus);
    return Result.ok(entries);
  };
};
