import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { KnowledgeStatus, KnowledgeStatusVO } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';

export const approveKnowledgeInputSchema = z.object({
  id: z.string().min(1, 'id is required'),
  updatedBy: z.string().min(1, 'updatedBy is required'),
});

export type ApproveKnowledgeInput = z.infer<typeof approveKnowledgeInputSchema>;

export type ApproveKnowledge = UseCase<ApproveKnowledgeInput, IKnowledge, DomainError>;

export const makeApproveKnowledge = (knowledgeRepository: IKnowledgeRepository): ApproveKnowledge => {
  return async (input: ApproveKnowledgeInput) => {
    const parsed = approveKnowledgeInputSchema.safeParse(input);
    if (!parsed.success) {
      return Result.fail(new ValidationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    const existingResult = await knowledgeRepository.getById(IdVO.create(parsed.data.id));
    if (existingResult.isFailure) {
      return Result.fail(existingResult.getError());
    }

    const existing = existingResult.getValue();
    if (!existing) {
      return Result.fail(new NotFoundError(`Knowledge not found: ${parsed.data.id}`));
    }

    if (existing.status === KnowledgeStatus.ACTIVE) {
      return Result.ok(existing);
    }

    if (existing.status === KnowledgeStatus.REJECTED) {
      return Result.fail(
        new ValidationError(`Cannot approve a REJECTED entry. Re-create it instead.`),
      );
    }

    const updateResult = await knowledgeRepository.updateStatus(
      IdVO.create(parsed.data.id),
      KnowledgeStatusVO.create(KnowledgeStatus.ACTIVE),
      IdVO.create(parsed.data.updatedBy),
    );
    if (updateResult.isFailure) {
      return Result.fail(updateResult.getError());
    }

    const refreshedResult = await knowledgeRepository.getById(IdVO.create(parsed.data.id));
    if (refreshedResult.isFailure) {
      return Result.fail(refreshedResult.getError());
    }

    const refreshed = refreshedResult.getValue();
    if (!refreshed) {
      return Result.fail(new NotFoundError(`Knowledge not found after approve: ${parsed.data.id}`));
    }

    return Result.ok(refreshed);
  };
};
