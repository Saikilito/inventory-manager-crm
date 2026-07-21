import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { zodIdString } from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import { validateInput } from '../../../../../../shared-domain/src/shared/validate-input.js';
import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { KnowledgeStatus, KnowledgeStatusVO } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';

export const rejectKnowledgeInputSchema = z.object({
  id: zodIdString,
  updatedBy: zodIdString,
});

export type RejectKnowledgeInput = z.infer<typeof rejectKnowledgeInputSchema>;

export type RejectKnowledge = UseCase<RejectKnowledgeInput, IKnowledge, DomainError>;

export const makeRejectKnowledge = (knowledgeRepository: IKnowledgeRepository): RejectKnowledge => {
  return async (input: RejectKnowledgeInput) => {
    const parsed = validateInput(rejectKnowledgeInputSchema, input);
    if (parsed.isFailure) return Result.fail(parsed.getError());

    const { id, updatedBy } = parsed.getValue();

    const existingResult = await knowledgeRepository.getById(IdVO.create(id));
    if (existingResult.isFailure) return Result.fail(existingResult.getError());

    const existing = existingResult.getValue();
    if (!existing) return Result.fail(new NotFoundError(`Knowledge not found: ${id}`));

    if (existing.status === KnowledgeStatus.REJECTED) return Result.ok(existing);

    if (existing.status === KnowledgeStatus.ACTIVE) {
      return Result.fail(new ValidationError('Cannot reject an ACTIVE entry. Soft-delete it instead.'));
    }

    const updateResult = await knowledgeRepository.updateStatus(
      IdVO.create(id),
      KnowledgeStatusVO.create(KnowledgeStatus.REJECTED),
      IdVO.create(updatedBy),
    );
    if (updateResult.isFailure) return Result.fail(updateResult.getError());

    const refreshedResult = await knowledgeRepository.getById(IdVO.create(id));
    if (refreshedResult.isFailure) return Result.fail(refreshedResult.getError());

    const refreshed = refreshedResult.getValue();
    if (!refreshed) return Result.fail(new NotFoundError(`Knowledge not found after reject: ${id}`));

    return Result.ok(refreshed);
  };
};
